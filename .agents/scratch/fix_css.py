
import os

path = r'c:\Users\Faizan\Desktop\junko_bodie\src\app\tournament\tournament.module.css'
with open(path, 'rb') as f:
    content = f.read()

# Try to decode as utf-8, but handle the weird encoding we might have created
try:
    decoded = content.decode('utf-8')
except UnicodeDecodeError:
    # If it fails, it might be UTF-16
    try:
        decoded = content.decode('utf-16')
    except:
        decoded = content.decode('utf-8', errors='ignore')

lines = decoded.splitlines()
valid_lines = []
for line in lines:
    if '. c u s t o m S c r o l l b a r' in line or '.customScrollbar' in line:
        # Check if this line is part of our corrupted append
        if '. c u s t o m S c r o l l b a r' in line:
            break
        # If it's valid .customScrollbar (unlikely but safe), we check if it's the start of the corruption
    valid_lines.append(line)

# Specifically look for the last valid brace from the original file
# The last line before our append was line 676: }
last_valid_index = -1
for i, line in enumerate(valid_lines):
    if line.strip() == '}' and i > 600: # We know it was near the end
        last_valid_index = i

if last_valid_index != -1:
    valid_lines = valid_lines[:last_valid_index + 1]

new_css = """
.customScrollbar::-webkit-scrollbar {
  width: 6px;
}
.customScrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.customScrollbar::-webkit-scrollbar-thumb {
  background: rgba(201, 164, 76, 0.2);
  border-radius: 10px;
}
.customScrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(201, 164, 76, 0.4);
}

.stickyTable thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #f5edd5;
  box-shadow: inset 0 -1px 0 rgba(201, 164, 76, 0.2);
}
"""

with open(path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(valid_lines) + '\n' + new_css)

print("File fixed successfully")
