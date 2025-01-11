# Use Maven image to build the project
FROM maven:3.8.7-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml and dependencies first
COPY backend/PortailRH/pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the project files
COPY backend/PortailRH/. .
RUN mvn clean package -DskipTests

# Debugging: List the contents of the target directory
RUN ls -l /app/target

# Use a slim OpenJDK 17 image for running the application
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/PortailRH-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
<<<<<<< HEAD
ENTRYPOINT ["java", "-jar", "app.jar"]
=======
ENTRYPOINT ["java", "-jar", "app.jar"]
>>>>>>> 7f08b07faf8cfe7cf0447ca1d1baa87f4943d3d9
