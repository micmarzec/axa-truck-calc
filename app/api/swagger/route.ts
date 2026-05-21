import { createSwaggerSpec } from 'next-swagger-doc';

export const GET = async () => {
  try {
    const spec = createSwaggerSpec({
      apiFolder: 'app/api', // define api folder under app structure
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'Antigravity API Documentation',
          version: '1.0.0',
          description: 'API documentation for the Antigravity application operations including policy declarations, debug tools, and XML transfers.',
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [],
      },
    });

    return new Response(JSON.stringify(spec), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Swagger generation error', error);
    return new Response(JSON.stringify({ error: 'Failed to generate documentation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
