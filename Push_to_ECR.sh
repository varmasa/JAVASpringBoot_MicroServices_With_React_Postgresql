export AWS_ACCOUNT_ID=876163988748
export AWS_REGION=ap-south-1
export ECR="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

for service in product cart auth order review payment
do
  echo "========== Pushing cloudcart-${service} =========="

  docker image inspect "cloudcart-${service}:1.0" >/dev/null 2>&1 || {
    echo "ERROR: Local image cloudcart-${service}:1.0 not found"
    exit 1
  }

  docker tag "cloudcart-${service}:1.0" \
    "${ECR}/cloudcart-${service}:1.0" || exit 1

  docker push "${ECR}/cloudcart-${service}:1.0" || exit 1

  echo "SUCCESS: cloudcart-${service}:1.0 pushed"
done

echo "All six CloudCart images pushed successfully."
