import logging
import sys
from app.core.config import settings


def setup_logging() -> logging.Logger:
    logger = logging.getLogger(settings.PROJECT_NAME)
    logger.setLevel(settings.LOG_LEVEL.upper())

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(console_handler)

    return logger


logger = setup_logging()