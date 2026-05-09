FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY bus-management/ ./bus-management/
COPY bus-management-frontend/ ./bus-management-frontend/

RUN mvn -f bus-management/pom.xml package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/bus-management/target/bus-management-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
