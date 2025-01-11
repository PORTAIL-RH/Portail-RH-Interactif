# Use Maven image to build the project
FROM maven:3.8.7-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml from the correct location
COPY backend/PortailRH/pom.xml .
RUN mvn dependency:go-offline

# Now copy the rest of the project files
COPY backend/PortailRH/. .
RUN mvn clean package -DskipTests

# Use a lightweight OpenJDK image for the final container
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
