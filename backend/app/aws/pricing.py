"""Rough monthly cost estimates, not real AWS Cost Explorer figures.

Good enough for surfacing relative cost/savings in the dashboard without
requiring Cost Explorer to be enabled (which has a ~24h first-activation
delay and must be turned on manually per account).
"""

EC2_MONTHLY_BY_TYPE = {
    "t3.nano": 3.8, "t3.micro": 7.6, "t3.small": 15.2, "t3.medium": 30.4,
    "t3.large": 60.8, "t3.xlarge": 121.7, "t2.micro": 8.5, "t2.small": 17,
    "t2.medium": 34, "m5.large": 70, "m5.xlarge": 140, "m5.2xlarge": 280,
    "c5.large": 62, "c5.xlarge": 124, "r5.large": 91, "r5.xlarge": 182,
}
EC2_DEFAULT_MONTHLY = 40.0

EBS_PER_GB_MONTHLY = 0.08
EBS_DEFAULT_GB = 20

ELASTIC_IP_UNATTACHED_MONTHLY = 3.6

RDS_MONTHLY_BY_CLASS = {
    "db.t3.micro": 12.4, "db.t3.small": 24.8, "db.t3.medium": 49.6,
    "db.t4g.micro": 11.2, "db.m5.large": 140, "db.r5.large": 175,
}
RDS_DEFAULT_MONTHLY = 60.0

LAMBDA_ESTIMATED_MONTHLY = 1.5
S3_PER_GB_MONTHLY = 0.023


def ec2_monthly_cost(instance_type: str) -> float:
    return EC2_MONTHLY_BY_TYPE.get(instance_type, EC2_DEFAULT_MONTHLY)


def rds_monthly_cost(instance_class: str) -> float:
    return RDS_MONTHLY_BY_CLASS.get(instance_class, RDS_DEFAULT_MONTHLY)


def ebs_monthly_cost(size_gb: int) -> float:
    return round((size_gb or EBS_DEFAULT_GB) * EBS_PER_GB_MONTHLY, 2)


def s3_monthly_cost(size_bytes: int) -> float:
    gb = size_bytes / (1024**3)
    return round(max(gb, 0) * S3_PER_GB_MONTHLY, 2)
