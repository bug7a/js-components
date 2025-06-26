import os

# .min.js dosyalarının bulunduğu klasör
source_folder = os.path.dirname(os.path.abspath(__file__))

# Birleştirilecek olan dosyanın adı
output_file = os.path.join(source_folder, 'components.js')

# output_file dosyasını oluştur veya sıfırla
with open(output_file, 'w') as outfile:
    outfile.write('"use strict";\n')

    for filename in os.listdir(source_folder):
        if filename.endswith('.min.js'):
            filepath = os.path.join(source_folder, filename)
            with open(filepath, 'r') as infile:
                content = infile.read()
                # "use strict" ifadelerini kaldır
                content = content.replace('"use strict";', '').replace("'use strict';", '')
                outfile.write(content + '\n')

print(f'All .min.js files have been merged into {output_file}')
