# Two-stage build: compile the JAR with the JDK, then run it on a slim JRE.
# Render reads this Dockerfile via the blueprint in ../render.yaml.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# Cache Maven dependencies before copying the source — speeds up rebuilds.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q -DskipTests package \
    && cp target/portal-backend-*.jar /workspace/app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar

# Render injects PORT; the Spring config picks it up via ${PORT:8080}.
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_TOOL_OPTIONS -jar /app/app.jar"]
