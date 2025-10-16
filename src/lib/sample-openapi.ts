export const sampleOpenApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Acme Storefront API",
    version: "1.2.0",
    description:
      "The Acme Storefront API enables teams to manage products, process customer orders, and access customer information using a modern REST interface.",
    contact: {
      name: "Acme Developer Relations",
      url: "https://developers.acme-store.com",
      email: "support@acme-store.com",
    },
  },
  servers: [
    {
      url: "https://api.acme-store.com/v1",
      description: "Production",
    },
    {
      url: "https://sandbox.acme-store.com/v1",
      description: "Sandbox",
    },
  ],
  tags: [
    {
      name: "Catalog",
      description: "Manage the product catalog and related assets.",
    },
    {
      name: "Orders",
      description: "Create, update, and retrieve customer orders.",
    },
    {
      name: "Customers",
      description: "Access and administer customer profile data.",
    },
  ],
  paths: {
    "/products": {
      get: {
        tags: ["Catalog"],
        summary: "List products",
        description:
          "Returns a paginated list of products filtered by optional criteria such as category or availability status.",
        parameters: [
          {
            name: "category",
            in: "query",
            description: "Return only products assigned to the provided category slug.",
            schema: {
              type: "string",
            },
          },
          {
            name: "status",
            in: "query",
            description: "Filter products by status.",
            schema: {
              type: "string",
              enum: ["draft", "active", "archived"],
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Maximum number of products to return per page.",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
            },
            example: 25,
          },
          {
            name: "cursor",
            in: "query",
            description: "Pagination cursor returned from a previous call.",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "A list of products with pagination metadata.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Product",
                      },
                    },
                    nextCursor: {
                      type: "string",
                      nullable: true,
                    },
                  },
                  required: ["data"],
                },
                example: {
                  data: [
                    {
                      id: "prod_6V7K1",
                      name: "Coffee Grinder",
                      slug: "coffee-grinder",
                      status: "active",
                      price: {
                        amount: 12900,
                        currency: "USD",
                        display: "$129.00",
                      },
                      summary: "Precision burr grinder with 40 grind settings.",
                      createdAt: "2024-03-12T15:21:44Z",
                    },
                    {
                      id: "prod_6V9H4",
                      name: "Pour-Over Kettle",
                      slug: "pour-over-kettle",
                      status: "active",
                      price: {
                        amount: 8900,
                        currency: "USD",
                        display: "$89.00",
                      },
                      summary: "Stainless steel kettle with precision spout for pour-over brewing.",
                      createdAt: "2024-01-04T09:12:18Z",
                    },
                  ],
                  nextCursor: "WyJwcm9kXzZWOUswIiwiMjAyNC0wNC0wMVQxMTo0NToxOFoiXQ==",
                },
              },
              "application/xml": {
                schema: {
                  type: "string",
                },
                example:
                  "<products><product><id>prod_6V7K1</id><name>Coffee Grinder</name></product><product><id>prod_6V9H4</id><name>Pour-Over Kettle</name></product></products>",
              },
            },
          },
          "400": {
            description: "Invalid request parameters.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "ValidationError",
                  message: "\"limit\" must be less than or equal to 100",
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Catalog"],
        summary: "Create product",
        description:
          "Creates a new product in the catalog. The product is saved in the \"draft\" status by default unless otherwise specified.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateProductInput",
              },
              example: {
                name: "Cold Brew Bottle",
                slug: "cold-brew-bottle",
                status: "draft",
                summary: "Reusable glass bottle designed for cold brew concentrate.",
                price: {
                  amount: 3500,
                  currency: "USD",
                },
                tags: ["brewing", "accessories"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Product created successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product",
                },
              },
            },
          },
          "409": {
            description: "A product with the provided slug already exists.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Conflict",
                  message: "A product with slug \"cold-brew-bottle\" already exists.",
                },
              },
            },
          },
        },
      },
    },
    "/products/{productId}": {
      get: {
        tags: ["Catalog"],
        summary: "Get product",
        description: "Retrieve a single product using its identifier.",
        parameters: [
          {
            name: "productId",
            in: "path",
            required: true,
            description: "The unique product identifier.",
            schema: {
              type: "string",
            },
          },
          {
            name: "include",
            in: "query",
            description: "Comma-separated list of related resources to expand (e.g. \"inventory,media\").",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "The requested product.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Product",
                },
              },
            },
          },
          "404": {
            description: "Product not found.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "NotFound",
                  message: "No product found for id prod_12345.",
                },
              },
            },
          },
        },
      },
    },
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders",
        description: "Returns recent orders sorted by creation date in descending order.",
        parameters: [
          {
            name: "status",
            in: "query",
            description: "Filter orders by status.",
            schema: {
              type: "string",
              enum: ["draft", "processing", "fulfilled", "cancelled"],
            },
          },
          {
            name: "customerId",
            in: "query",
            description: "Return only orders belonging to the provided customer ID.",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Orders matching the query.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Order",
                      },
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Orders"],
        summary: "Create order",
        description: "Creates a new customer order and reserves the associated inventory.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateOrderInput",
              },
              example: {
                customerId: "cust_45AB",
                items: [
                  {
                    productId: "prod_6V7K1",
                    quantity: 2,
                  },
                ],
                shippingAddress: {
                  line1: "456 Market Street",
                  city: "Portland",
                  region: "OR",
                  postalCode: "97205",
                  country: "US",
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created successfully.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Order",
                },
              },
            },
          },
          "422": {
            description: "The request body failed validation.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/orders/{orderId}": {
      get: {
        tags: ["Orders"],
        summary: "Get order",
        description: "Retrieve the latest state of an order by its identifier.",
        parameters: [
          {
            name: "orderId",
            in: "path",
            required: true,
            description: "The order identifier.",
            schema: {
              type: "string",
            },
          },
          {
            name: "expand",
            in: "query",
            description: "Optional list of related resources to expand (e.g. \"customer\").",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "The requested order.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Order",
                },
              },
            },
          },
          "404": {
            description: "Order not found.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/customers/{customerId}": {
      get: {
        tags: ["Customers"],
        summary: "Get customer",
        description: "Returns customer profile details and default shipping address.",
        parameters: [
          {
            name: "customerId",
            in: "path",
            required: true,
            description: "The customer identifier.",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          "200": {
            description: "Customer profile.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Customer",
                },
              },
            },
          },
          "404": {
            description: "Customer not found.",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Money: {
        type: "object",
        description: "Monetary value represented in minor units.",
        properties: {
          amount: {
            type: "integer",
            description: "Minor units (for USD this is cents).",
          },
          currency: {
            type: "string",
            description: "Three-letter ISO currency code.",
            example: "USD",
          },
          display: {
            type: "string",
            description: "Human-readable currency string.",
          },
        },
        required: ["amount", "currency"],
      },
      Product: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique product identifier.",
          },
          name: {
            type: "string",
            description: "Display name of the product.",
          },
          slug: {
            type: "string",
            description: "URL friendly identifier.",
          },
          status: {
            type: "string",
            enum: ["draft", "active", "archived"],
            description: "Current lifecycle state of the product.",
          },
          summary: {
            type: "string",
            description: "Short marketing description.",
          },
          price: {
            $ref: "#/components/schemas/Money",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp in ISO 8601 format.",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp in ISO 8601 format.",
          },
        },
        required: ["id", "name", "slug", "status", "price", "createdAt"],
      },
      CreateProductInput: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Display name of the product.",
          },
          slug: {
            type: "string",
            description: "URL friendly identifier.",
          },
          summary: {
            type: "string",
            description: "Short marketing description.",
          },
          status: {
            type: "string",
            enum: ["draft", "active", "archived"],
            description: "Lifecycle state of the product.",
          },
          price: {
            type: "object",
            description: "Price definition in minor units.",
            properties: {
              amount: {
                type: "integer",
              },
              currency: {
                type: "string",
              },
            },
            required: ["amount", "currency"],
          },
          tags: {
            type: "array",
            description: "Collection of tags used for search and filtering.",
            items: {
              type: "string",
            },
          },
        },
        required: ["name", "slug", "price"],
      },
      Order: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Order identifier.",
          },
          status: {
            type: "string",
            enum: ["draft", "processing", "fulfilled", "cancelled"],
          },
          subtotal: {
            $ref: "#/components/schemas/Money",
          },
          taxTotal: {
            $ref: "#/components/schemas/Money",
          },
          total: {
            $ref: "#/components/schemas/Money",
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/OrderItem",
            },
          },
          customerId: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
        required: ["id", "status", "subtotal", "total", "items", "customerId"],
      },
      OrderItem: {
        type: "object",
        properties: {
          productId: {
            type: "string",
          },
          name: {
            type: "string",
          },
          quantity: {
            type: "integer",
            minimum: 1,
          },
          unitPrice: {
            $ref: "#/components/schemas/Money",
          },
        },
        required: ["productId", "quantity", "unitPrice"],
      },
      CreateOrderInput: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
            description: "Customer identifier placing the order.",
          },
          items: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              properties: {
                productId: {
                  type: "string",
                },
                quantity: {
                  type: "integer",
                  minimum: 1,
                  default: 1,
                },
              },
              required: ["productId"],
            },
          },
          shippingAddress: {
            $ref: "#/components/schemas/ShippingAddress",
          },
          notes: {
            type: "string",
            description: "Internal order notes.",
          },
        },
        required: ["customerId", "items"],
      },
      ShippingAddress: {
        type: "object",
        properties: {
          line1: {
            type: "string",
          },
          line2: {
            type: "string",
          },
          city: {
            type: "string",
          },
          region: {
            type: "string",
          },
          postalCode: {
            type: "string",
          },
          country: {
            type: "string",
            minLength: 2,
            maxLength: 2,
          },
        },
        required: ["line1", "city", "region", "postalCode", "country"],
      },
      Customer: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          email: {
            type: "string",
            format: "email",
          },
          name: {
            type: "string",
          },
          defaultShippingAddress: {
            $ref: "#/components/schemas/ShippingAddress",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
        },
        required: ["id", "email", "createdAt"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
          },
          message: {
            type: "string",
          },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: {
                  type: "string",
                },
                message: {
                  type: "string",
                },
              },
            },
          },
        },
        required: ["error", "message"],
      },
    },
  },
} as const
