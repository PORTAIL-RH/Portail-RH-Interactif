# Use Maven image to build the project (valid image)
FROM maven:3.8.7-eclipse-temurin-17 AS build

# Set the working directory
WORKDIR /app

# Copy the POM file first (to leverage Docker caching)
COPY pom.xml .

# Download dependencies (cache optimization)
RUN mvn dependency:go-offline

# Now copy the entire source code
COPY . .

# Build the project
RUN mvn clean package -DskipTests

# Use a slim OpenJDK 17 image for running the application
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=build /app/target/demo-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
