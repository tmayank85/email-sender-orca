# Server Information API Documentation

## Overview
The Server Information API provides details about the current server including IP addresses, system information, and access URLs.

## Endpoint
```
GET /api/server-info
```

## Description
This endpoint returns comprehensive information about the server hosting the email service, including:
- Server hostname and system details
- All available network interface IP addresses
- Primary IP address for network access
- Local and network URLs
- Server uptime
- Current timestamp

## Request
No parameters required. Simple GET request.

```bash
curl http://localhost:3000/api/server-info
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Server information retrieved successfully",
  "data": {
    "hostname": "DESKTOP-ABC123",
    "platform": "win32",
    "architecture": "x64",
    "port": 3000,
    "networkInterfaces": [
      {
        "interface": "Wi-Fi",
        "address": "192.168.1.100",
        "netmask": "255.255.255.0"
      },
      {
        "interface": "Ethernet",
        "address": "192.168.0.50",
        "netmask": "255.255.255.0"
      }
    ],
    "primaryIP": "192.168.1.100",
    "urls": {
      "local": "http://localhost:3000",
      "network": "http://192.168.1.100:3000"
    },
    "uptime": 3600.5,
    "timestamp": "2025-08-22T10:30:00.000Z"
  }
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to retrieve server information",
  "error": "Error details here"
}
```

## Response Fields Explanation

| Field | Type | Description |
|-------|------|-------------|
| `hostname` | string | Server computer name |
| `platform` | string | Operating system platform (win32, linux, darwin) |
| `architecture` | string | CPU architecture (x64, arm64, etc.) |
| `port` | number | Port number the server is running on |
| `networkInterfaces` | array | List of all network interfaces with IP addresses |
| `networkInterfaces[].interface` | string | Network interface name |
| `networkInterfaces[].address` | string | IPv4 address of the interface |
| `networkInterfaces[].netmask` | string | Network subnet mask |
| `primaryIP` | string | Primary IP address for external access |
| `urls.local` | string | Local access URL (localhost) |
| `urls.network` | string | Network access URL (using primary IP) |
| `uptime` | number | Server uptime in seconds |
| `timestamp` | string | Current server timestamp in ISO format |

## Use Cases

### 1. Frontend Configuration
Use this API to dynamically configure your frontend to connect to the correct server URL:

```typescript
const getServerInfo = async () => {
  try {
    const response = await fetch('/api/server-info');
    const data = await response.json();
    
    if (data.success) {
      // Use network URL for external access
      const serverUrl = data.data.urls.network;
      console.log('Server accessible at:', serverUrl);
      return data.data;
    }
  } catch (error) {
    console.error('Failed to get server info:', error);
  }
};
```

### 2. Network Discovery
Useful for applications that need to discover and connect to the service from other devices on the network:

```javascript
// Get all available IP addresses
const serverInfo = await getServerInfo();
const availableIPs = serverInfo.networkInterfaces.map(ni => ni.address);
console.log('Server available on IPs:', availableIPs);
```

### 3. Health Monitoring
Monitor server uptime and system information:

```javascript
const checkServerHealth = async () => {
  const info = await getServerInfo();
  console.log(`Server uptime: ${Math.floor(info.uptime)} seconds`);
  console.log(`Platform: ${info.platform} ${info.architecture}`);
};
```

### 4. Mobile App Configuration
Mobile apps can use this to automatically configure the correct server endpoint:

```typescript
interface ServerInfo {
  primaryIP: string;
  port: number;
  urls: {
    local: string;
    network: string;
  };
}

const configureApiEndpoint = async (): Promise<string> => {
  const response = await fetch('http://localhost:3000/api/server-info');
  const data = await response.json();
  
  // Use network URL for mobile devices
  return data.data.urls.network;
};
```

## Examples

### cURL Example
```bash
# Get server information
curl -X GET http://localhost:3000/api/server-info

# Pretty print JSON response
curl -X GET http://localhost:3000/api/server-info | jq '.'
```

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

async function getServerDetails() {
  try {
    const response = await axios.get('http://localhost:3000/api/server-info');
    const serverInfo = response.data.data;
    
    console.log('Server Details:');
    console.log(`Hostname: ${serverInfo.hostname}`);
    console.log(`Primary IP: ${serverInfo.primaryIP}`);
    console.log(`Network URL: ${serverInfo.urls.network}`);
    console.log(`Uptime: ${Math.floor(serverInfo.uptime)} seconds`);
    
    return serverInfo;
  } catch (error) {
    console.error('Error fetching server info:', error.message);
  }
}

getServerDetails();
```

### Python Example
```python
import requests
import json

def get_server_info():
    try:
        response = requests.get('http://localhost:3000/api/server-info')
        data = response.json()
        
        if data['success']:
            server_info = data['data']
            print(f"Server running on: {server_info['urls']['network']}")
            print(f"Primary IP: {server_info['primaryIP']}")
            print(f"Platform: {server_info['platform']}")
            return server_info
        else:
            print(f"Error: {data['message']}")
    except Exception as e:
        print(f"Failed to get server info: {e}")

get_server_info()
```

## Notes

1. **Network Access**: The `network` URL can be used to access the service from other devices on the same network.

2. **Multiple Interfaces**: The API returns all network interfaces, useful for servers with multiple network connections.

3. **Dynamic IP Detection**: Automatically detects and returns the primary IP address for external access.

4. **Cross-Platform**: Works on Windows, macOS, and Linux systems.

5. **Real-time Information**: Returns current uptime and timestamp for monitoring purposes.
