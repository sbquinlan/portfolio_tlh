FROM eclipse-temurin:17-jre-jammy

EXPOSE 5000

# create user
RUN addgroup --gid 1000 ibkrs && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" ibkrs

# install unzip
RUN apt-get update && \
    apt-get install -y unzip && \
    rm -rf /var/lib/apt/lists/*

# download client portal
RUN curl https://download2.interactivebrokers.com/portal/clientportal.gw.zip -o /tmp/clientportal.gw.zip && \
    unzip /tmp/clientportal.gw.zip -d /opt/clientportal && \
    rm /tmp/clientportal.gw.zip && \
    chown -R ibkrs:ibkrs /opt/clientportal

WORKDIR /opt/clientportal
USER ibkrs

COPY dist root/webapps/rebalance
COPY conf.yaml root/conf.yaml
CMD /opt/clientportal/bin/run.sh root/conf.yaml