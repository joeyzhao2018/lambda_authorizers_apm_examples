package example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
//import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
//import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
//import com.amazonaws.services.dynamodbv2.model.AttributeValue;
//import com.amazonaws.services.s3.AmazonS3;
//import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class DDBWriter implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
//    private final AmazonDynamoDB dynamoDb = AmazonDynamoDBClientBuilder.standard().build();
//    private final AmazonS3 s3Client = AmazonS3ClientBuilder.standard().build();
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    private final String tableName = System.getenv("TABLE_NAME");
    private final String bucketName = System.getenv("BUCKET_NAME");
    private final DynamoDbClient dynamoDb = DynamoDbClient.builder()
            .region(Region.CA_CENTRAL_1)
//            .region(Region.of(System.getenv("AWS_REGION")))
            .build();

    private final S3Client s3Client = S3Client.builder()
            .region(Region.CA_CENTRAL_1)
//            .region(Region.of(System.getenv("AWS_REGION")))
            .build();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        context.getLogger().log("Input: " + input.getBody());

        try {
            // Parse input JSON if present, or create a sample item

            Item item;
            if (input.getBody() != null && !input.getBody().isEmpty()) {
                item = gson.fromJson(input.getBody(), Item.class);
            } else {
                item = new Item();
                item.setId(UUID.randomUUID().toString());
                item.setName("Sample Item");
                item.setDescription("This is a sample item created at " + java.time.Instant.now());
            }
//            //v1
//            // Write to DynamoDB
//            Map<String, AttributeValue> itemValues = new HashMap<>();
//            itemValues.put("id", new AttributeValue(item.getId()));
//            itemValues.put("name", new AttributeValue(item.getName()));
//            itemValues.put("description", new AttributeValue(item.getDescription()));
//
//            dynamoDb.putItem(tableName, itemValues);


            // v2
            Map<String, AttributeValue> itemValues = new HashMap<>();
            itemValues.put("id", AttributeValue.builder().s(item.getId()).build());
            itemValues.put("name", AttributeValue.builder().s(item.getName()).build());

            PutItemRequest putItemRequest = PutItemRequest.builder()
                    .tableName(tableName)
                    .item(itemValues)
                    .build();

            dynamoDb.putItem(putItemRequest);

            // Write to S3
            String s3Key = "items/" + item.getId() + ".json";
            String jsonContent = gson.toJson(item);
            //v1
//            s3Client.putObject(bucketName, s3Key, jsonContent);
//
//
            //v2
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType("application/json")
                    .build();

            s3Client.putObject(putObjectRequest,
                    RequestBody.fromString(jsonContent, StandardCharsets.UTF_8));

            // Create response
            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(200);
            response.setBody(gson.toJson(item));
            response.setHeaders(Map.of("Content-Type", "application/json"));

            return response;
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());

            APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
            response.setStatusCode(500);
            response.setBody("{\"error\":\"" + e.getMessage() + "\"}");
            response.setHeaders(Map.of("Content-Type", "application/json"));

            return response;
        }
    }

    public static class Item {
        private String id;
        private String name;
        private String description;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}