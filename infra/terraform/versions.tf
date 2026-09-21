terraform {
  required_version = ">= 1.9"

  # State lives in the R2 bucket sendtally-tfstate, through R2's S3-compatible
  # API. The bucket is created by hand (`wrangler r2 bucket create`) because
  # state cannot live in a bucket this config creates. Credentials come from
  # AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, an R2 API token.
  backend "s3" {
    bucket = "sendtally-tfstate"
    key    = "sendtally.tfstate"
    region = "auto"

    endpoints = {
      s3 = "https://f3514650e9f74f7fe7db71fdd6577a8f.r2.cloudflarestorage.com"
    }

    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }
}

provider "cloudflare" {
  api_token = var.CLOUDFLARE_API_TOKEN
}
