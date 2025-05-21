# Selenoid VNC Client

A simple web client for connecting to Selenoid browser sessions via VNC.

**Note:** This is a simple client for testing purposes and not intended as a production solution.

## Overview

This tool provides a web interface for connecting to VNC-enabled browser sessions running in Selenoid. It allows you to:

- Enter a Selenoid session ID to connect to
- View the browser session in real-time
- Control the browser session via VNC

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Selenoid running with VNC enabled (`--vnc` flag)
- noVNC client files

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/elielprado/selenoidVncViewer.git
   cd selenoidVncViewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Download noVNC:
   ```bash
   mkdir -p novnc
   curl -L https://github.com/novnc/noVNC/archive/refs/tags/v1.4.0.tar.gz | tar -xz --strip-components=1 -C novnc
   ```

4. Create a `.env` file based on the `.env.example` (optional):
   ```bash
   cp .env.example .env
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Usage

1. Start Selenoid with VNC support:
   ```bash
   cm selenoid start --vnc --args "-limit 50 -session-attempt-timeout 2m" -e "TZ=America/Sao_Paulo"
   ```

2. Start Selenoid UI (optional but useful for getting session IDs):
   ```bash
   cm selenoid-ui start
   ```

3. Run your Selenium tests with VNC enabled:
   ```python
   options = webdriver.ChromeOptions()
   options.set_capability(
       'selenoid:options',
       {
           'enableVNC': True,
           'enableVideo': True,
           'screenResolution': '1920x1080',
           'name': 'Test Session',
       },
   )
   driver = webdriver.Remote(command_executor="http://192.168.100.6:4444/wd/hub", options=options)
   ```

4. Get the session ID from your test:
   ```python
   print(f"Session ID: {driver.session_id}")
   ```

5. Access the VNC client at `http://localhost:8080` and enter the session ID

## Configuration

You can configure the client using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port to run the server on | `8080` |
| `SELENIUM_HOST` | The host and port of Selenoid | `192.168.100.6:4444` |
| `SESSION_ID` | Default session ID (optional) | `""` |
| `VNC_SECRET` | Password for VNC authentication | `"selenoid"` |

## Troubleshooting

- **Connection issues**: Make sure Selenoid is running with VNC enabled
- **Blank screen**: The browser session may have ended or not started yet
- **Authentication errors**: Check if your Selenoid is using a custom VNC password

## License

MIT License

## Author

Eliel Floriano Resende do Prado
