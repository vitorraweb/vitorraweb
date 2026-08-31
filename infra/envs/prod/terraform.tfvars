# Account ids are not secrets — they appear in every ARN — but they are the
# guard that stops a stale AWS_PROFILE building production resources somewhere
# unexpected. See allowed_account_ids in providers.tf.
account_id = "574247905057"
env        = "prod"
region     = "eu-west-1"
