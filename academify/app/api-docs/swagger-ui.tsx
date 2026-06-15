"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerUi() {
  return (
    <SwaggerUI
      url="/api/swagger"
      docExpansion="list"
      defaultModelsExpandDepth={1}
      deepLinking
    />
  );
}
