"""
HealthPath v2 - Production-Grade Training Pipeline
=====================================================
Why a Pipeline?
  The old code ran SimpleImputer, RobustScaler, and LabelEncoder on the FULL
  dataset *before* train_test_split.  That means statistics from test rows
  leaked into training, giving a fake 99.99 % accuracy.

  sklearn.pipeline.Pipeline fits every transformer ONLY on X_train during
  .fit() and merely .transform()s X_test, so no future data ever contaminates
  the training statistics.  The fitted pipeline is serialised as one object,
  guaranteeing that the exact same preprocessing is applied at inference time.

Algorithm: XGBClassifier (gradient-boosted trees) - the industry standard for
tabular / structured medical data.

Usage
-----
    python train_model_v2.py                          # uses defaults
    python train_model_v2.py --dataset path/to/csv    # custom dataset
"""

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
import os
import json
import logging
import warnings
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")                       # headless backend for servers
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    RandomizedSearchCV,
    cross_val_score,
)
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    LabelEncoder,
    OneHotEncoder,
    RobustScaler,
)
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    handlers=[logging.FileHandler("training_v2.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TARGET_COLUMN = "Disease"
FEATURE_COLUMNS = [
    "Age", "Gender", "BloodPressure", "Cholesterol", "Glucose",
    "HeartRate", "BMI", "Fever", "Cough", "Fatigue",
    "Headache", "Nausea", "ShortnessBreath",
]
NUMERICAL_FEATURES = [
    "Age", "BloodPressure", "Cholesterol", "Glucose",
    "HeartRate", "BMI", "Fever", "Cough", "Fatigue",
    "Headache", "Nausea", "ShortnessBreath",
]
CATEGORICAL_FEATURES = ["Gender"]

# These are the names after feature-engineering adds two interaction columns:
NUMERICAL_FEATURES_AFTER_FE = NUMERICAL_FEATURES + [
    "Age_BP_Interaction",
    "BMI_Cholesterol_Interaction",
]


from custom_transformers import MedicalFeatureEngineer  # shared so joblib can unpickle


# =========================================================================
# Build the full sklearn Pipeline
# =========================================================================
def build_pipeline(n_classes: int) -> Pipeline:
    """Return an unfitted Pipeline: FeatureEngineer â†’ ColumnTransformer â†’ XGB."""

    # --- Numerical sub-pipeline: impute â†’ scale --------------------------
    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  RobustScaler()),
    ])

    # --- Categorical sub-pipeline: impute â†’ one-hot ---------------------
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
        ("onehot",  OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    # --- ColumnTransformer applies the right pipeline to the right cols --
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline, NUMERICAL_FEATURES_AFTER_FE),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",          # drop any extra columns
    )

    # --- XGBoost classifier with sane regularisation defaults ------------
    xgb_clf = XGBClassifier(
        objective="multi:softprob" if n_classes > 2 else "binary:logistic",
        eval_metric="mlogloss"     if n_classes > 2 else "logloss",
        use_label_encoder=False,
        tree_method="hist",         # fast histogram-based method
        random_state=42,
        # Regularisation to fight overfitting on medical data
        max_depth=6,
        learning_rate=0.1,
        n_estimators=300,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,              # L1
        reg_lambda=1.0,             # L2
        min_child_weight=3,
        gamma=0.1,
    )

    # --- Full pipeline ---------------------------------------------------
    pipeline = Pipeline([
        ("feature_engineer", MedicalFeatureEngineer()),
        ("preprocessor",     preprocessor),
        ("classifier",       xgb_clf),
    ])

    return pipeline


# =========================================================================
# Hyperparameter search space
# =========================================================================
PARAM_DISTRIBUTIONS = {
    "classifier__n_estimators":    [100, 200, 300, 500],
    "classifier__max_depth":       [4, 5, 6, 7, 8],
    "classifier__learning_rate":   [0.01, 0.05, 0.1, 0.2],
    "classifier__subsample":       [0.7, 0.8, 0.9, 1.0],
    "classifier__colsample_bytree":[0.7, 0.8, 0.9, 1.0],
    "classifier__min_child_weight":[1, 3, 5, 7],
    "classifier__gamma":           [0, 0.1, 0.2, 0.3],
    "classifier__reg_alpha":       [0, 0.01, 0.1, 1.0],
    "classifier__reg_lambda":      [0.5, 1.0, 2.0, 5.0],
}


# =========================================================================
# Training orchestration
# =========================================================================
def train(
    dataset_path: str = "New_dataset.csv",
    output_dir: str = "models",
    tune: bool = True,
    cv_folds: int = 5,
    test_size: float = 0.20,
    random_state: int = 42,
):
    """End-to-end training: load â†’ split â†’ tune â†’ evaluate â†’ save."""

    # 1. Load data --------------------------------------------------------
    logger.info("Loading dataset: %s", dataset_path)
    df = pd.read_csv(dataset_path)
    logger.info("Shape: %s  |  Columns: %s", df.shape, df.columns.tolist())

    # Keep only columns we care about
    available_features = [c for c in FEATURE_COLUMNS if c in df.columns]
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found in dataset!")
    df = df[available_features + [TARGET_COLUMN]].copy()

    # 2. Encode target label ----------------------------------------------
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df[TARGET_COLUMN])
    X = df[available_features].copy()
    n_classes = len(label_encoder.classes_)
    logger.info("Classes (%d): %s", n_classes, label_encoder.classes_.tolist())

    # 3. Train / test split (BEFORE any preprocessing) --------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    logger.info("Train size: %d  |  Test size: %d", len(X_train), len(X_test))

    # 4. Build pipeline ---------------------------------------------------
    pipeline = build_pipeline(n_classes)

    # 5. Hyperparameter tuning with RandomizedSearchCV --------------------
    if tune:
        logger.info("Starting RandomizedSearchCV (5-fold Stratified) â€¦")
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
        search = RandomizedSearchCV(
            estimator=pipeline,
            param_distributions=PARAM_DISTRIBUTIONS,
            n_iter=40,                  # 40 random combos - good trade-off
            scoring="f1_weighted",
            cv=cv,
            random_state=random_state,
            n_jobs=1,                   # n_jobs=1 avoids pickling issues on Windows
            verbose=1,
            refit=True,                 # refit best model on full X_train
        )
        search.fit(X_train, y_train)
        pipeline = search.best_estimator_
        logger.info("Best CV F1 (weighted): %.4f", search.best_score_)
        logger.info("Best params: %s", search.best_params_)
        best_params = search.best_params_
        best_cv_score = float(search.best_score_)
    else:
        logger.info("Training pipeline (no tuning) â€¦")
        pipeline.fit(X_train, y_train)
        # Quick cross-val on training set
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
        cv_scores = cross_val_score(pipeline, X_train, y_train, cv=cv,
                                    scoring="f1_weighted", n_jobs=1)
        logger.info("CV F1: %.4f ± %.4f", cv_scores.mean(), cv_scores.std())
        best_params = {}
        best_cv_score = float(cv_scores.mean())

    # 6. Evaluate on held-out test set ------------------------------------
    y_pred  = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    test_accuracy  = accuracy_score(y_test, y_pred)
    test_f1        = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    test_precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    test_recall    = recall_score(y_test, y_pred, average="weighted", zero_division=0)

    logger.info("=" * 60)
    logger.info("  TEST SET RESULTS")
    logger.info("  Accuracy : %.4f", test_accuracy)
    logger.info("  Precision: %.4f", test_precision)
    logger.info("  Recall   : %.4f", test_recall)
    logger.info("  F1       : %.4f", test_f1)
    logger.info("=" * 60)

    report_str = classification_report(
        y_test, y_pred, target_names=label_encoder.classes_, zero_division=0
    )
    logger.info("\nClassification Report:\n%s", report_str)

    # 7. Feature importance from XGB inside the pipeline ------------------
    xgb_model = pipeline.named_steps["classifier"]
    booster_importances = xgb_model.feature_importances_

    # Map back to human-readable names
    preprocessor = pipeline.named_steps["preprocessor"]
    try:
        ohe = preprocessor.named_transformers_["cat"].named_steps["onehot"]
        cat_names = ohe.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    except Exception:
        cat_names = CATEGORICAL_FEATURES
    all_feature_names = NUMERICAL_FEATURES_AFTER_FE + cat_names
    # Guard against length mismatch
    if len(all_feature_names) != len(booster_importances):
        all_feature_names = [f"f{i}" for i in range(len(booster_importances))]

    feature_importance = dict(
        sorted(
            zip(all_feature_names, booster_importances.tolist()),
            key=lambda kv: kv[1],
            reverse=True,
        )
    )
    logger.info("\nTop feature importances:")
    for feat, imp in list(feature_importance.items())[:10]:
        logger.info("  %-30s  %.4f", feat, imp)

    # 8. Save artefacts ---------------------------------------------------
    os.makedirs(output_dir, exist_ok=True)

    pipeline_path = os.path.join(output_dir, "healthpath_pipeline_v2.joblib")
    label_enc_path = os.path.join(output_dir, "label_encoder_v2.joblib")
    metadata_path  = os.path.join(output_dir, "model_metadata.json")

    joblib.dump(pipeline, pipeline_path)
    logger.info("Pipeline saved -> %s", pipeline_path)

    joblib.dump(label_encoder, label_enc_path)
    logger.info("Label encoder saved -> %s", label_enc_path)

    metadata = {
        "model_type": "XGBClassifier (inside sklearn Pipeline)",
        "version": "2.0.0",
        "trained_at": datetime.now().isoformat(),
        "dataset": os.path.basename(dataset_path),
        "n_samples_train": len(X_train),
        "n_samples_test": len(X_test),
        "n_classes": n_classes,
        "classes": label_encoder.classes_.tolist(),
        "feature_columns": available_features,
        "test_metrics": {
            "accuracy": round(test_accuracy, 4),
            "precision": round(test_precision, 4),
            "recall": round(test_recall, 4),
            "f1_score": round(test_f1, 4),
        },
        "best_cv_f1": round(best_cv_score, 4),
        "best_params": best_params,
        "feature_importance": {k: round(v, 6) for k, v in feature_importance.items()},
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info("Metadata saved -> %s", metadata_path)

    # 9. Confusion-matrix heatmap -----------------------------------------
    try:
        cm = confusion_matrix(y_test, y_pred)
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=label_encoder.classes_,
            yticklabels=label_encoder.classes_,
        )
        plt.title("Confusion Matrix - HealthPath v2")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
        plt.tight_layout()
        cm_path = os.path.join(output_dir, "confusion_matrix_v2.png")
        plt.savefig(cm_path, dpi=150)
        plt.close()
        logger.info("Confusion matrix saved -> %s", cm_path)
    except Exception as exc:
        logger.warning("Could not save confusion matrix: %s", exc)

    logger.info("Training complete.")
    return metadata


# =========================================================================
# Script entry point
# =========================================================================
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="HealthPath v2 - Train ML Pipeline")
    parser.add_argument("--dataset", type=str, default="New_dataset.csv",
                        help="Path to CSV dataset (default: New_dataset.csv)")
    parser.add_argument("--output", type=str, default="models",
                        help="Directory for saved artefacts (default: models)")
    parser.add_argument("--no-tune", action="store_true",
                        help="Skip hyperparameter search (faster, uses defaults)")
    parser.add_argument("--cv-folds", type=int, default=5,
                        help="Number of CV folds (default: 5)")
    args = parser.parse_args()

    train(
        dataset_path=args.dataset,
        output_dir=args.output,
        tune=not args.no_tune,
        cv_folds=args.cv_folds,
    )


