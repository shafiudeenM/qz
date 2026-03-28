import socket
import sys

def check_dns(hostname):
    print(f"--- Diagnosing DNS for {hostname} ---")
    
    # 1. Standard library check
    try:
        addr = socket.gethostbyname(hostname)
        print(f"✅ Success (socket.gethostbyname): {addr}")
    except socket.gaierror as e:
        print(f"❌ Failed (socket.gethostbyname): {e}")

    # 2. Advanced socket check
    try:
        info = socket.getaddrinfo(hostname, 443)
        print(f"✅ Success (socket.getaddrinfo): {info[0][4][0]}")
    except Exception as e:
        print(f"❌ Failed (socket.getaddrinfo): {e}")

    # 3. Check connectivity to Google DNS
    try:
        s = socket.create_connection(("8.8.8.8", 53), timeout=3)
        print("✅ Connectivity to 8.8.8.8: Success")
        s.close()
    except Exception as e:
        print(f"❌ Connectivity to 8.8.8.8: Failed ({e})")

if __name__ == "__main__":
    host = "wxspazagvipmquhgvdan.supabase.co"
    if len(sys.argv) > 1:
        host = sys.argv[1]
    check_dns(host)

if __name__ == "__main__":
    host = "wxspazagvipmquhgvdan.supabase.co"
    if len(sys.argv) > 1:
        host = sys.argv[1]
    check_dns(host)
