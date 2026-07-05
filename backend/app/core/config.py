from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CloudClean API"
    database_url: str = "sqlite:///./cloudclean.db"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Real AWS integration
    platform_aws_account_id: str = ""
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""
    cognito_app_client_secret: str = ""
    aws_region: str = "us-east-1"

    class Config:
        env_file = ".env"


settings = Settings()
