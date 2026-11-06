"""Assemble unmodified live browser captures into a labelled review sheet."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'screenshots/live-1.3')
items=[('aggressive','spear'),('defensive','flail'),('counterattacker','sword'),('evasive','twinSwords'),('balanced','halberd'),('berserker','warhammer'),('patient','rapier')]
w,h=390,585
out=Image.new('RGB',(w*4,h*2),'#f2ead7');draw=ImageDraw.Draw(out)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',16)
for i,(style,weapon) in enumerate(items):
    shot=Image.open(root/f'style-{style}-{weapon}.png').convert('RGB')
    x,y=(i%4)*w,(i//4)*h
    # Only remove browser-game header: the actual arena pixels are not altered.
    shot=shot.crop((0,55,390,625))
    out.paste(shot,(x,y+15));draw.rectangle((x,y,x+w,y+25),fill='#f2ead7')
    draw.text((x+9,y+4),f'{style.upper()} / {weapon}',font=font,fill='#26382e')
draw.multiline_text((3*w+24,h+150),'RAGDOLL RIVALS\nv1.3\n\nOriginal artwork\nLive server simulation\n390 × 664 phone captures\n\nNo pose mock-ups',font=font,fill='#26382e',spacing=10)
out.save(root/'style-montage.png')
print(root/'style-montage.png')
