package com.example.PortailRH.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.convert.DbRefResolver;
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class MongoConfig {

    private static final Logger logger = LoggerFactory.getLogger(MongoConfig.class);

    /**
     * Customizes the MappingMongoConverter to replace dots in map keys.
     * MongoDB does not allow dots ('.') or dollar signs ('$') in field names.
     * This configuration replaces dots with underscores ('_') automatically
     * during persistence to prevent MappingExceptions.
     *
     * @param factory the MongoDatabaseFactory bean (auto-injected by Spring)
     * @param context the MongoMappingContext bean (auto-injected by Spring)
     * @return a configured MappingMongoConverter bean
     */
    @Bean
    public MappingMongoConverter mappingMongoConverter(MongoDatabaseFactory factory, MongoMappingContext context) {

        logger.info("Configuring MappingMongoConverter with dot replacement.");

        DbRefResolver dbRefResolver = new DefaultDbRefResolver(factory);
        MappingMongoConverter converter = new MappingMongoConverter(dbRefResolver, context);

        // Replace '.' with '_' in map keys when saving to MongoDB
        // This prevents errors when skills like ".NET" are encountered.
        converter.setMapKeyDotReplacement("_");
        logger.info("Set MapKeyDotReplacement to '_'");

        // Optional: You could also remove the _class field if you don't need it
        // converter.setTypeMapper(new DefaultMongoTypeMapper(null));

        converter.afterPropertiesSet(); // Initialize the converter
        return converter;
    }
}