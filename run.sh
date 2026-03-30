#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# ── Colors ──
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

FRAMEWORKS=(react vue solid angular ember)
EXAMPLES=(todo-list api-call simple-animation complex-animation drag-api-animation realtime-dashboard form-wizard)

usage() {
  echo -e "${BOLD}Pulse Example Runner${RESET}"
  echo ""
  echo "Usage:"
  echo "  ./run.sh                              Interactive picker"
  echo "  ./run.sh all                          Launch ALL frameworks in one app"
  echo "  ./run.sh <framework> <example>        Run a specific example"
  echo "  ./run.sh showcase <framework>         Run all examples for a framework (routed)"
  echo "  ./run.sh list                         List all examples"
  echo "  ./run.sh build                        Build all packages"
  echo "  ./run.sh test                         Run core tests"
  echo "  ./run.sh build-all-examples           Build (not serve) every example"
  echo ""
  echo "Frameworks: ${FRAMEWORKS[*]}"
  echo "Examples:   ${EXAMPLES[*]}"
  echo ""
  echo "Example:  ./run.sh all"
  echo "          ./run.sh react todo-list"
  echo "          ./run.sh showcase react"
}

ensure_deps() {
  if [ ! -d "$ROOT/node_modules" ]; then
    echo -e "${CYAN}Installing dependencies...${RESET}"
    pnpm install --no-frozen-lockfile
  fi
}

build_core() {
  if [ ! -d "$ROOT/packages/core/dist" ]; then
    echo -e "${CYAN}Building @pulse/core...${RESET}"
    pnpm --filter @pulse/core build
  fi
}

run_showcase() {
  local fw="$1"
  local dir="$ROOT/examples/${fw}-showcase"

  if [ ! -d "$dir" ]; then
    echo -e "${RED}Showcase not found: $dir${RESET}"
    exit 1
  fi

  ensure_deps
  build_core

  echo -e "${GREEN}Starting ${BOLD}${fw} showcase${RESET}${GREEN} (all 7 examples with routing)...${RESET}"
  echo ""

  if [ "$fw" = "angular" ]; then
    cd "$dir"
    npx ng serve --open 2>&1
  else
    cd "$dir"
    npx vite --open
  fi
}

run_example() {
  local fw="$1"
  local ex="$2"
  local dir="$ROOT/examples/$fw/$ex"

  if [ ! -d "$dir" ]; then
    echo -e "${RED}Example not found: $dir${RESET}"
    exit 1
  fi

  ensure_deps
  build_core

  echo -e "${GREEN}Starting ${BOLD}$fw/$ex${RESET}${GREEN}...${RESET}"
  echo ""

  if [ "$fw" = "angular" ]; then
    cd "$dir"
    if command -v npx &>/dev/null && [ -f "angular.json" ]; then
      npx ng serve --open 2>&1
    else
      echo -e "${YELLOW}Angular examples require @angular/cli.${RESET}"
      echo "Run: cd $dir && npx ng serve"
    fi
  else
    cd "$dir"
    npx vite --open
  fi
}

list_examples() {
  echo -e "${BOLD}Available Examples${RESET}"
  echo ""

  echo -e "  ${YELLOW}Showcases (all examples in one app with routing):${RESET}"
  for fw in "${FRAMEWORKS[@]}"; do
    local dir="$ROOT/examples/${fw}-showcase"
    if [ -d "$dir" ]; then
      echo "    ./run.sh showcase $fw"
    fi
  done
  echo ""

  for fw in "${FRAMEWORKS[@]}"; do
    echo -e "  ${CYAN}$fw${RESET}"
    for ex in "${EXAMPLES[@]}"; do
      local dir="$ROOT/examples/$fw/$ex"
      if [ -d "$dir" ]; then
        echo "    $ex"
      fi
    done
    echo ""
  done
}

build_all() {
  ensure_deps
  echo -e "${CYAN}Building all packages...${RESET}"
  pnpm --filter @pulse/core build
  echo -e "${GREEN}Core built.${RESET}"
}

run_tests() {
  ensure_deps
  echo -e "${CYAN}Running core tests...${RESET}"
  pnpm --filter @pulse/core test
}

build_all_examples() {
  ensure_deps
  build_core

  local passed=0
  local failed=0
  local failures=""

  echo -e "${BOLD}Building individual examples...${RESET}"
  for fw in "${FRAMEWORKS[@]}"; do
    for ex in "${EXAMPLES[@]}"; do
      local dir="$ROOT/examples/$fw/$ex"
      [ ! -d "$dir" ] && continue

      # skip non-vite examples for build check
      [ ! -f "$dir/vite.config.ts" ] && continue

      printf "  %-45s" "$fw/$ex"
      if (cd "$dir" && npx vite build) &>/dev/null; then
        echo -e "${GREEN}OK${RESET}"
        passed=$((passed + 1))
      else
        echo -e "${RED}FAIL${RESET}"
        failed=$((failed + 1))
        failures="$failures\n    $fw/$ex"
      fi
    done
  done

  echo ""
  echo -e "${BOLD}Building showcases...${RESET}"
  for fw in "${FRAMEWORKS[@]}"; do
    local dir="$ROOT/examples/${fw}-showcase"
    [ ! -d "$dir" ] && continue

    # skip non-vite showcases
    [ ! -f "$dir/vite.config.ts" ] && continue

    printf "  %-45s" "${fw}-showcase"
    if (cd "$dir" && npx vite build) &>/dev/null; then
      echo -e "${GREEN}OK${RESET}"
      passed=$((passed + 1))
    else
      echo -e "${RED}FAIL${RESET}"
      failed=$((failed + 1))
      failures="$failures\n    ${fw}-showcase"
    fi
  done

  echo ""
  echo -e "${GREEN}Passed: $passed${RESET}  ${RED}Failed: $failed${RESET}"
  if [ -n "$failures" ]; then
    echo -e "${RED}Failures:$failures${RESET}"
    exit 1
  fi
}

interactive_picker() {
  echo -e "${BOLD}Pulse Example Runner${RESET}"
  echo ""
  echo -e "${CYAN}How would you like to run examples?${RESET}"
  echo "  1) Showcase — all 7 examples in one app with sidebar routing"
  echo "  2) Individual — run a single example"
  echo ""
  read -rp "Choice [1-2]: " mode_choice

  if [ "$mode_choice" = "1" ]; then
    echo ""
    echo -e "${CYAN}Pick a framework:${RESET}"
    for i in "${!FRAMEWORKS[@]}"; do
      echo "  $((i + 1))) ${FRAMEWORKS[$i]}"
    done
    echo ""
    read -rp "Framework [1-${#FRAMEWORKS[@]}]: " fw_choice

    if ! [[ "$fw_choice" =~ ^[0-9]+$ ]] || [ "$fw_choice" -lt 1 ] || [ "$fw_choice" -gt "${#FRAMEWORKS[@]}" ]; then
      echo -e "${RED}Invalid choice.${RESET}"
      exit 1
    fi
    local fw="${FRAMEWORKS[$((fw_choice - 1))]}"
    echo ""
    run_showcase "$fw"
  else
    echo ""
    echo -e "${CYAN}Pick a framework:${RESET}"
    for i in "${!FRAMEWORKS[@]}"; do
      echo "  $((i + 1))) ${FRAMEWORKS[$i]}"
    done
    echo ""
    read -rp "Framework [1-${#FRAMEWORKS[@]}]: " fw_choice

    if ! [[ "$fw_choice" =~ ^[0-9]+$ ]] || [ "$fw_choice" -lt 1 ] || [ "$fw_choice" -gt "${#FRAMEWORKS[@]}" ]; then
      echo -e "${RED}Invalid choice.${RESET}"
      exit 1
    fi
    local fw="${FRAMEWORKS[$((fw_choice - 1))]}"

    echo ""
    echo -e "${CYAN}Pick an example:${RESET}"
    for i in "${!EXAMPLES[@]}"; do
      echo "  $((i + 1))) ${EXAMPLES[$i]}"
    done
    echo ""
    read -rp "Example [1-${#EXAMPLES[@]}]: " ex_choice

    if ! [[ "$ex_choice" =~ ^[0-9]+$ ]] || [ "$ex_choice" -lt 1 ] || [ "$ex_choice" -gt "${#EXAMPLES[@]}" ]; then
      echo -e "${RED}Invalid choice.${RESET}"
      exit 1
    fi
    local ex="${EXAMPLES[$((ex_choice - 1))]}"

    echo ""
    run_example "$fw" "$ex"
  fi
}

run_all() {
  ensure_deps
  build_core

  PIDS=()
  PORTS=()
  NAMES=()

  cleanup() {
    echo ""
    echo -e "${CYAN}Shutting down all servers...${RESET}"
    for pid in "${PIDS[@]}"; do
      kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null
    echo -e "${GREEN}Done.${RESET}"
    exit 0
  }
  trap cleanup INT TERM

  # Start Vite-based showcases in background
  declare -A FW_PORTS=( [react]=3001 [vue]=3002 [solid]=3003 [angular]=3004 [ember]=3005 )

  for fw in react vue solid ember; do
    local dir="$ROOT/examples/${fw}-showcase"
    if [ -d "$dir" ]; then
      echo -e "  Starting ${BOLD}${fw}${RESET} showcase on port ${FW_PORTS[$fw]}..."
      (cd "$dir" && npx vite --port "${FW_PORTS[$fw]}" --strictPort) &>/dev/null &
      PIDS+=($!)
      PORTS+=(${FW_PORTS[$fw]})
      NAMES+=("$fw")
    fi
  done

  # Start Angular showcase
  local angular_dir="$ROOT/examples/angular-showcase"
  if [ -d "$angular_dir" ] && [ -f "$angular_dir/angular.json" ]; then
    echo -e "  Starting ${BOLD}angular${RESET} showcase on port ${FW_PORTS[angular]}..."
    (cd "$angular_dir" && npx ng serve --port "${FW_PORTS[angular]}" --open=false) &>/dev/null &
    PIDS+=($!)
    PORTS+=(${FW_PORTS[angular]})
    NAMES+=("angular")
  fi

  # Wait for servers to start
  sleep 3

  echo ""
  echo -e "${GREEN}Framework servers running:${RESET}"
  for i in "${!NAMES[@]}"; do
    echo -e "  ${NAMES[$i]}: http://localhost:${PORTS[$i]}"
  done

  echo ""
  echo -e "${BOLD}Starting master showcase on http://localhost:3000${RESET}"
  echo -e "${YELLOW}Press Ctrl+C to stop all servers${RESET}"
  echo ""

  cd "$ROOT/examples/master-showcase"
  npx vite --port 3000 --strictPort --open

  cleanup
}

# ── Main ──
case "${1:-}" in
  "")
    interactive_picker
    ;;
  help|--help|-h)
    usage
    ;;
  all)
    run_all
    ;;
  list)
    list_examples
    ;;
  build)
    build_all
    ;;
  test)
    run_tests
    ;;
  build-all-examples)
    build_all_examples
    ;;
  showcase)
    if [ -z "${2:-}" ]; then
      echo -e "${RED}Usage: ./run.sh showcase <framework>${RESET}"
      echo "Frameworks: ${FRAMEWORKS[*]}"
      exit 1
    fi
    run_showcase "$2"
    ;;
  *)
    if [ -z "${2:-}" ]; then
      echo -e "${RED}Usage: ./run.sh <framework> <example>${RESET}"
      echo "Or:    ./run.sh showcase <framework>"
      echo "Or:    ./run.sh all"
      echo "Run ./run.sh list to see all options."
      exit 1
    fi
    run_example "$1" "$2"
    ;;
esac
