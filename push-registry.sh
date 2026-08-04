#!/bin/bash
# Push Docker images to registry
# Usage: ./push-registry.sh [registry_url] [tag]
# Examples:
#   ./push-registry.sh docker.io/myuser
#   ./push-registry.sh ghcr.io/myorg myrepo/v1.0.0
#   ./push-registry.sh localhost:5000 latest

REGISTRY="${1:-docker.io/myuser}"
TAG="${2:-latest}"
IMAGES=(
    "helpdesk-backend:latest"
    "helpdesk-frontend:latest"
    "helpdesk-app:latest"
)

echo "Pushing images to registry: $REGISTRY"
echo "Tag: $TAG"
echo ""

for IMAGE in "${IMAGES[@]}"; do
    # Extract image name (without :latest)
    IMAGE_NAME="${IMAGE%:*}"
    
    # Create registry image name
    REGISTRY_IMAGE="$REGISTRY/$IMAGE_NAME:$TAG"
    
    echo "Tagging: $IMAGE -> $REGISTRY_IMAGE"
    docker tag "$IMAGE" "$REGISTRY_IMAGE"
    
    echo "Pushing: $REGISTRY_IMAGE"
    docker push "$REGISTRY_IMAGE"
    
    if [ $? -eq 0 ]; then
        echo "✓ $REGISTRY_IMAGE pushed successfully"
    else
        echo "✗ Failed to push $REGISTRY_IMAGE"
        exit 1
    fi
    echo ""
done

echo "All images pushed successfully!"
echo ""
echo "To pull and run from registry:"
echo "  docker compose -f docker-compose.registry.yml up"
