#!/bin/bash

# Supabase Storage Migration Script using CLI
# Make sure you have supabase CLI installed: npm install -g supabase

# Configuration - UPDATE THESE VALUES
SOURCE_PROJECT_REF="aukjtuadtfpmlcfqusaa"
SOURCE_DB_PASSWORD="your-source-db-password"
DEST_PROJECT_URL="https://supabasekong-wsg0o44oscw8so048ssogw4s.lomtechnology.com"
DEST_ANON_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NjIwOTM2MCwiZXhwIjo0OTExODgyOTYwLCJyb2xlIjoiYW5vbiJ9.-n6Co_e_047ID4rnmjh1pJlz8Ju_wOMtHTnGXkSsgRE"
DEST_SERVICE_KEY="yeyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if supabase CLI is installed
check_cli() {
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Install it with: npm install -g supabase"
        exit 1
    fi
    log_success "Supabase CLI found"
}

# Login to Supabase
login_supabase() {
    log_info "Logging into Supabase..."
    if supabase login; then
        log_success "Successfully logged into Supabase"
    else
        log_error "Failed to login to Supabase"
        exit 1
    fi
}

# Get storage buckets info from source database
get_buckets_info() {
    log_info "Getting buckets information from source database..."

    psql "postgresql://postgres:${SOURCE_DB_PASSWORD}@db.${SOURCE_PROJECT_REF}.supabase.co:5432/postgres" \
        -c "SELECT name, public FROM storage.buckets;" \
        -t -A -F',' > buckets_info.csv

    if [ $? -eq 0 ]; then
        log_success "Retrieved buckets information"
        cat buckets_info.csv
    else
        log_error "Failed to retrieve buckets information"
        exit 1
    fi
}

# Download storage objects
download_storage() {
    log_info "Starting storage download..."

    # Create download directory
    mkdir -p storage_download
    cd storage_download

    # Read buckets and download files
    while IFS=',' read -r bucket_name is_public; do
        if [ ! -z "$bucket_name" ]; then
            log_info "Processing bucket: $bucket_name"
            mkdir -p "$bucket_name"

            # List all files in bucket and download them
            log_info "Listing files in bucket: $bucket_name"

            # Get file list from database
            psql "postgresql://postgres:${SOURCE_DB_PASSWORD}@db.${SOURCE_PROJECT_REF}.supabase.co:5432/postgres" \
                -c "SELECT name, bucket_id FROM storage.objects WHERE bucket_id = '$bucket_name';" \
                -t -A -F',' > "${bucket_name}_files.txt"

            # Download each file
            while IFS=',' read -r file_name bucket_id; do
                if [ ! -z "$file_name" ] && [ "$file_name" != "name" ]; then
                    log_info "Downloading: $file_name"

                    # Create directory structure if needed
                    file_dir=$(dirname "$bucket_name/$file_name")
                    mkdir -p "$file_dir"

                    # Download using curl with signed URL
                    # Note: You might need to modify this part to generate signed URLs
                    # This is a simplified version
                    curl -o "$bucket_name/$file_name" \
                        "https://${SOURCE_PROJECT_REF}.supabase.co/storage/v1/object/public/$bucket_name/$file_name" \
                        2>/dev/null

                    if [ $? -eq 0 ]; then
                        log_success "Downloaded: $file_name"
                    else
                        log_warning "Failed to download: $file_name (might be private)"
                    fi
                fi
            done < "${bucket_name}_files.txt"
        fi
    done < ../buckets_info.csv

    cd ..
    log_success "Download completed"
}

# Create buckets in destination
create_dest_buckets() {
    log_info "Creating buckets in destination Supabase..."

    while IFS=',' read -r bucket_name is_public; do
        if [ ! -z "$bucket_name" ] && [ "$bucket_name" != "name" ]; then
            log_info "Creating bucket: $bucket_name (public: $is_public)"

            # Use curl to create bucket via REST API
            if [ "$is_public" = "t" ]; then
                public_flag="true"
            else
                public_flag="false"
            fi

            curl -X POST "${DEST_PROJECT_URL}/storage/v1/bucket" \
                -H "Authorization: Bearer ${DEST_SERVICE_KEY}" \
                -H "Content-Type: application/json" \
                -d "{\"id\":\"$bucket_name\",\"name\":\"$bucket_name\",\"public\":$public_flag}"

            log_success "Created bucket: $bucket_name"
        fi
    done < buckets_info.csv
}

# Upload files to destination
upload_storage() {
    log_info "Starting storage upload..."

    cd storage_download

    while IFS=',' read -r bucket_name is_public; do
        if [ ! -z "$bucket_name" ] && [ "$bucket_name" != "name" ] && [ -d "$bucket_name" ]; then
            log_info "Uploading files to bucket: $bucket_name"

            # Upload all files in the bucket directory
            find "$bucket_name" -type f | while read file_path; do
                # Remove bucket name from path to get the object path
                object_path=${file_path#$bucket_name/}

                log_info "Uploading: $object_path"

                curl -X POST "${DEST_PROJECT_URL}/storage/v1/object/$bucket_name/$object_path" \
                    -H "Authorization: Bearer ${DEST_SERVICE_KEY}" \
                    -F "file=@$file_path"

                if [ $? -eq 0 ]; then
                    log_success "Uploaded: $object_path"
                else
                    log_error "Failed to upload: $object_path"
                fi
            done
        fi
    done < ../buckets_info.csv

    cd ..
    log_success "Upload completed"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f buckets_info.csv
    rm -rf storage_download/
    log_success "Cleanup completed"
}

# Main migration function
main() {
    log_info "Starting Supabase Storage Migration"
    log_info "Source: ${SOURCE_PROJECT_REF}.supabase.co"
    log_info "Destination: $DEST_PROJECT_URL"

    # Check prerequisites
    check_cli

    # Perform migration steps
    login_supabase
    get_buckets_info
    create_dest_buckets
    download_storage
    upload_storage

    log_success "🎉 Migration completed successfully!"

    # Ask if user wants to cleanup
    read -p "Do you want to clean up downloaded files? (y/N): " cleanup_choice
    if [[ $cleanup_choice =~ ^[Yy]$ ]]; then
        cleanup
    else
        log_info "Downloaded files kept in storage_download/ directory"
    fi
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Supabase Storage Migration Script"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  migrate     - Run complete migration (default)"
    echo "  download    - Only download files from source"
    echo "  upload      - Only upload files to destination"
    echo "  cleanup     - Remove temporary files"
    echo ""
    echo "Before running, update the configuration variables at the top of this script!"
    echo ""
fi

# Handle commands
case "${1:-migrate}" in
    "migrate")
        main
        ;;
    "download")
        check_cli
        login_supabase
        get_buckets_info
        download_storage
        ;;
    "upload")
        create_dest_buckets
        upload_storage
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        log_error "Unknown command: $1"
        exit 1
        ;;
esac