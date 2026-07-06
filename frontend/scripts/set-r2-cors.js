import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3"

const endpoint = "https://fba1cd78b5f83abd727ffd95bd6ce95e.r2.cloudflarestorage.com"
const bucket = "setup-studio-videos"
const accessKeyId = "f36882d966a5aa9a7d458a05fc329f5f"
const secretAccessKey = "ccf4376844c01fab93f841891a37764ba58a9905fce50246da85d333c9f810de"

const client = new S3Client({
  region: "auto",
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
})

async function main() {
  try {
    await client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
            AllowedHeaders: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }))
    console.log("CORS policy set successfully on bucket:", bucket)
  } catch (err) {
    console.error("Failed to set CORS:", err.message)
  }
}

main()
