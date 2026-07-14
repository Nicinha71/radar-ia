from pydantic_settings import BaseSettings,SettingsConfigDict
class Settings(BaseSettings):
 app_name:str="Radar IA Produtos API"
 mercado_livre_base_url:str="https://api.mercadolibre.com"
 request_timeout_seconds:float=15.0
 model_config=SettingsConfigDict(env_file=".env",extra="ignore")
settings=Settings()
