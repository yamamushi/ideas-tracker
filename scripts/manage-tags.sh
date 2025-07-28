#!/bin/bash

# Tags Management Script for Ideas Tracker
# This script allows you to list, add, and delete tags

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TAGS]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Configuration paths
CONFIG_DIR="config"
TAGS_CONFIG="$CONFIG_DIR/tags.json"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "scripts" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create config directory if it doesn't exist
if [ ! -d "$CONFIG_DIR" ]; then
    mkdir -p "$CONFIG_DIR"
    print_info "Created config directory"
fi

# Function to initialize tags config with defaults
init_tags_config() {
    cat > "$TAGS_CONFIG" << 'EOF'
{
  "tags": [
    { "id": "technology", "name": "Technology", "color": "#3b82f6" },
    { "id": "business", "name": "Business", "color": "#10b981" },
    { "id": "design", "name": "Design", "color": "#f59e0b" },
    { "id": "marketing", "name": "Marketing", "color": "#ef4444" },
    { "id": "product", "name": "Product", "color": "#8b5cf6" },
    { "id": "research", "name": "Research", "color": "#06b6d4" },
    { "id": "innovation", "name": "Innovation", "color": "#f97316" },
    { "id": "improvement", "name": "Improvement", "color": "#84cc16" }
  ]
}
EOF
    print_success "Initialized tags configuration with default tags"
}

# Function to validate hex color
validate_color() {
    local color=$1
    if [[ $color =~ ^#[0-9A-Fa-f]{6}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check if tag ID exists
tag_id_exists() {
    local id=$1
    if [ ! -f "$TAGS_CONFIG" ]; then
        return 1
    fi
    
    local count=$(jq -r ".tags[] | select(.id == \"$id\") | .id" "$TAGS_CONFIG" 2>/dev/null | wc -l)
    [ "$count" -gt 0 ]
}

# Function to check if tag name exists
tag_name_exists() {
    local name=$1
    if [ ! -f "$TAGS_CONFIG" ]; then
        return 1
    fi
    
    local count=$(jq -r ".tags[] | select(.name == \"$name\") | .name" "$TAGS_CONFIG" 2>/dev/null | wc -l)
    [ "$count" -gt 0 ]
}

# Function to list all tags
list_tags() {
    print_status "Current Tags Configuration"
    echo ""
    
    if [ ! -f "$TAGS_CONFIG" ]; then
        print_warning "No tags configuration file found. Using default tags."
        print_info "Run 'init' command to create configuration file with defaults."
        echo ""
        echo "Default tags:"
        echo "  • technology (Technology) - #3b82f6"
        echo "  • business (Business) - #10b981"
        echo "  • design (Design) - #f59e0b"
        echo "  • marketing (Marketing) - #ef4444"
        echo "  • product (Product) - #8b5cf6"
        echo "  • research (Research) - #06b6d4"
        echo "  • innovation (Innovation) - #f97316"
        echo "  • improvement (Improvement) - #84cc16"
        return
    fi
    
    local tag_count=$(jq '.tags | length' "$TAGS_CONFIG" 2>/dev/null || echo "0")
    print_info "Total tags: $tag_count"
    echo ""
    
    if [ "$tag_count" -eq 0 ]; then
        print_warning "No tags configured"
        return
    fi
    
    printf "%-15s %-20s %-10s\n" "ID" "NAME" "COLOR"
    printf "%-15s %-20s %-10s\n" "---" "----" "-----"
    
    jq -r '.tags[] | "\(.id)|\(.name)|\(.color // "none")"' "$TAGS_CONFIG" 2>/dev/null | while IFS='|' read -r id name color; do
        if [ "$color" != "none" ]; then
            printf "%-15s %-20s %s\n" "$id" "$name" "$color"
        else
            printf "%-15s %-20s %s\n" "$id" "$name" "none"
        fi
    done
}

# Function to add a new tag
add_tag() {
    local id=$1
    local name=$2
    local color=$3
    
    # Validate inputs
    if [ -z "$id" ] || [ -z "$name" ]; then
        print_error "Tag ID and name are required"
        print_info "Usage: add <id> <name> [color]"
        return 1
    fi
    
    # Validate ID format (alphanumeric, lowercase, hyphens allowed)
    if [[ ! $id =~ ^[a-z0-9-]+$ ]]; then
        print_error "Tag ID must contain only lowercase letters, numbers, and hyphens"
        return 1
    fi
    
    # Validate color if provided
    if [ -n "$color" ] && ! validate_color "$color"; then
        print_error "Color must be a valid hex color (e.g., #3b82f6)"
        return 1
    fi
    
    # Initialize config if it doesn't exist
    if [ ! -f "$TAGS_CONFIG" ]; then
        init_tags_config
    fi
    
    # Check for duplicate ID
    if tag_id_exists "$id"; then
        print_error "Tag with ID '$id' already exists"
        return 1
    fi
    
    # Check for duplicate name
    if tag_name_exists "$name"; then
        print_error "Tag with name '$name' already exists"
        return 1
    fi
    
    # Add the tag
    local new_tag
    if [ -n "$color" ]; then
        new_tag=$(jq -n --arg id "$id" --arg name "$name" --arg color "$color" '{id: $id, name: $name, color: $color}')
    else
        new_tag=$(jq -n --arg id "$id" --arg name "$name" '{id: $id, name: $name}')
    fi
    
    jq ".tags += [$new_tag]" "$TAGS_CONFIG" > "${TAGS_CONFIG}.tmp" && mv "${TAGS_CONFIG}.tmp" "$TAGS_CONFIG"
    
    if [ $? -eq 0 ]; then
        print_success "Added tag: $id ($name)"
        if [ -n "$color" ]; then
            print_info "Color: $color"
        fi
    else
        print_error "Failed to add tag"
        return 1
    fi
}

# Function to delete a tag
delete_tag() {
    local id=$1
    
    if [ -z "$id" ]; then
        print_error "Tag ID is required"
        print_info "Usage: delete <id>"
        return 1
    fi
    
    if [ ! -f "$TAGS_CONFIG" ]; then
        print_error "No tags configuration file found"
        return 1
    fi
    
    # Check if tag exists
    if ! tag_id_exists "$id"; then
        print_error "Tag with ID '$id' not found"
        return 1
    fi
    
    # Get tag info before deletion
    local tag_name=$(jq -r ".tags[] | select(.id == \"$id\") | .name" "$TAGS_CONFIG")
    
    # Confirm deletion
    printf "${YELLOW}Are you sure you want to delete tag '$id' ($tag_name)? (y/N)${NC}: "
    read -r confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "Deletion cancelled"
        return 0
    fi
    
    # Delete the tag
    jq ".tags |= map(select(.id != \"$id\"))" "$TAGS_CONFIG" > "${TAGS_CONFIG}.tmp" && mv "${TAGS_CONFIG}.tmp" "$TAGS_CONFIG"
    
    if [ $? -eq 0 ]; then
        print_success "Deleted tag: $id ($tag_name)"
        print_warning "Note: Existing ideas with this tag will keep the tag until updated"
    else
        print_error "Failed to delete tag"
        return 1
    fi
}

# Function to validate tags configuration
validate_config() {
    print_status "Validating tags configuration"
    
    if [ ! -f "$TAGS_CONFIG" ]; then
        print_error "No tags configuration file found"
        print_info "Run 'init' command to create configuration file"
        return 1
    fi
    
    # Check JSON syntax
    if ! jq empty "$TAGS_CONFIG" 2>/dev/null; then
        print_error "Invalid JSON syntax in configuration file"
        return 1
    fi
    
    # Check structure
    if ! jq -e '.tags' "$TAGS_CONFIG" >/dev/null 2>&1; then
        print_error "Configuration must have a 'tags' array"
        return 1
    fi
    
    if ! jq -e '.tags | type == "array"' "$TAGS_CONFIG" >/dev/null 2>&1; then
        print_error "'tags' must be an array"
        return 1
    fi
    
    local errors=0
    local warnings=0
    
    # Validate each tag
    local tag_count=$(jq '.tags | length' "$TAGS_CONFIG")
    
    for ((i=0; i<tag_count; i++)); do
        local tag=$(jq ".tags[$i]" "$TAGS_CONFIG")
        local id=$(echo "$tag" | jq -r '.id // empty')
        local name=$(echo "$tag" | jq -r '.name // empty')
        local color=$(echo "$tag" | jq -r '.color // empty')
        
        # Validate ID
        if [ -z "$id" ]; then
            print_error "Tag at index $i: missing ID"
            ((errors++))
        elif [[ ! $id =~ ^[a-z0-9-]+$ ]]; then
            print_error "Tag at index $i: ID '$id' contains invalid characters"
            ((errors++))
        fi
        
        # Validate name
        if [ -z "$name" ]; then
            print_error "Tag at index $i: missing name"
            ((errors++))
        fi
        
        # Validate color
        if [ -n "$color" ] && ! validate_color "$color"; then
            print_warning "Tag '$name': invalid color format '$color'"
            ((warnings++))
        fi
    done
    
    # Check for duplicates
    local duplicate_ids=$(jq -r '.tags[].id' "$TAGS_CONFIG" | sort | uniq -d)
    if [ -n "$duplicate_ids" ]; then
        echo "$duplicate_ids" | while read -r dup_id; do
            print_error "Duplicate tag ID: $dup_id"
            ((errors++))
        done
    fi
    
    local duplicate_names=$(jq -r '.tags[].name' "$TAGS_CONFIG" | sort | uniq -d)
    if [ -n "$duplicate_names" ]; then
        echo "$duplicate_names" | while read -r dup_name; do
            print_warning "Duplicate tag name: $dup_name"
            ((warnings++))
        done
    fi
    
    echo ""
    if [ $errors -eq 0 ]; then
        print_success "Configuration is valid!"
        if [ $warnings -gt 0 ]; then
            print_info "$warnings warning(s) found"
        fi
    else
        print_error "$errors error(s) found"
        if [ $warnings -gt 0 ]; then
            print_info "$warnings warning(s) found"
        fi
        return 1
    fi
}

# Function to search tags
search_tags() {
    local query=$1
    
    if [ -z "$query" ]; then
        print_error "Search query is required"
        print_info "Usage: search <query>"
        return 1
    fi
    
    if [ ! -f "$TAGS_CONFIG" ]; then
        print_error "No tags configuration file found"
        return 1
    fi
    
    print_status "Searching for tags matching: '$query'"
    echo ""
    
    local results=$(jq -r ".tags[] | select(.id | test(\"$query\"; \"i\")) or select(.name | test(\"$query\"; \"i\")) | \"\(.id)|\(.name)|\(.color // \"none\")\"" "$TAGS_CONFIG" 2>/dev/null)
    
    if [ -z "$results" ]; then
        print_info "No tags found matching '$query'"
        return 0
    fi
    
    printf "%-15s %-20s %-10s\n" "ID" "NAME" "COLOR"
    printf "%-15s %-20s %-10s\n" "---" "----" "-----"
    
    echo "$results" | while IFS='|' read -r id name color; do
        printf "%-15s %-20s %s\n" "$id" "$name" "$color"
    done
}

# Function to show usage
show_usage() {
    echo "Tags Management Script for Ideas Tracker"
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Commands:"
    echo "  list                    List all tags"
    echo "  add <id> <name> [color] Add a new tag"
    echo "  delete <id>             Delete a tag"
    echo "  search <query>          Search tags by ID or name"
    echo "  validate                Validate tags configuration"
    echo "  init                    Initialize tags configuration with defaults"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 add mobile \"Mobile App\" \"#ff6b6b\""
    echo "  $0 delete mobile"
    echo "  $0 search tech"
    echo "  $0 validate"
    echo ""
    echo "Notes:"
    echo "  • Tag IDs must be lowercase, alphanumeric with hyphens"
    echo "  • Colors must be valid hex colors (e.g., #3b82f6)"
    echo "  • Configuration is stored in config/tags.json"
}

# Check if jq is installed
if ! command -v jq >/dev/null 2>&1; then
    print_error "jq is required but not installed"
    print_info "Install jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
fi

# Main script logic
case "${1:-}" in
    "list"|"ls")
        list_tags
        ;;
    "add")
        add_tag "$2" "$3" "$4"
        ;;
    "delete"|"del"|"rm")
        delete_tag "$2"
        ;;
    "search"|"find")
        search_tags "$2"
        ;;
    "validate"|"check")
        validate_config
        ;;
    "init"|"initialize")
        if [ -f "$TAGS_CONFIG" ]; then
            printf "${YELLOW}Tags configuration already exists. Overwrite? (y/N)${NC}: "
            read -r confirm
            if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
                print_info "Initialization cancelled"
                exit 0
            fi
        fi
        init_tags_config
        ;;
    "help"|"-h"|"--help"|"")
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac