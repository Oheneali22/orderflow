FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf \
      && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d \
      && touch /run/nginx.pid \
      && chown nginx:nginx /run/nginx.pid

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx:nginx index.html styles.css app.js /usr/share/nginx/html/

USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
   CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
