FROM maptiler/tileserver-gl:latest

WORKDIR /data

# Le dossier /data contient les fichiers MBTiles
EXPOSE 8080

CMD ["tileserver-gl", "--mbtiles", "/data/antananarivo.mbtiles"]
