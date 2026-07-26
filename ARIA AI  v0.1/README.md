# ARIA - Modular Desktop AI Assistant

ARIA (Automated Resilient Intelligent Assistant) is a clean, scalable, and modular desktop AI assistant built in Python.

## Project Structure

```text
ARIA/
├── aria/                  # Main Python source package
│   ├── core/              # Engine lifecycle & orchestrator
│   ├── config/            # Settings & environment management
│   ├── memory/            # Memory management & context store stubs
│   ├── tools/             # Extensible tool integration base classes
│   ├── voice/             # Voice input/output processing stubs
│   ├── agents/            # Multi-agent orchestrator stubs
│   ├── ui/                # User interface stubs (CLI/GUI)
│   └── utils/             # Logging and common utilities
├── config/                # Central YAML configuration files
├── logs/                  # Log storage output directory
├── docs/                  # Project architecture & documentation
├── assets/                # Media, icons, and static assets
├── tests/                 # Automated test suite
├── .env.example           # Environment template
├── .gitignore             # Git ignore definitions
├── README.md              # Project documentation
├── pyproject.toml         # Build system & package metadata
└── requirements.txt       # Project dependencies
```

## Setup & Running

### 1. Installation

Create a virtual environment and install dependencies:

```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Run ARIA

Run via the Python package launcher:

```bash
python -m aria.main
```

Or pass optional command line flags:

```bash
python -m aria.main --help
python -m aria.main --log-level DEBUG --config config/config.yaml
```

### 3. Run Tests

```bash
pytest
```
