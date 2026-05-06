import { toNextJsHandler } from "better-auth/next-js";

let _handlers: ReturnType<typeof toNextJsHandler> | null = null;

async function getHandlers() {
	console.log(`[route.ts] getHandlers called at ${Date.now()}`);
	if (_handlers) {
		console.log(`[route.ts] Returning cached handlers`);
		return _handlers;
	}
	console.log(`[route.ts] Importing @/lib/auth...`);
	const mod = await import("@/lib/auth");
	console.log(`[route.ts] Imported! Fetching auth instance...`);
	const auth = await mod.getAuth();
	console.log(`[route.ts] Auth instance fetched, calling toNextJsHandler...`);
	_handlers = toNextJsHandler(auth as any);
	console.log(`[route.ts] Handlers resolved!`);
	return _handlers;
}

export async function GET(request: Request) {
	console.log(`[route.ts] GET request to ${request.url}`);
	const h = await getHandlers();
	console.log(`[route.ts] Executing GET handler...`);
	return h.GET(request);
}

export async function POST(request: Request) {
	console.log(`[route.ts] POST request to ${request.url}`);
	const h = await getHandlers();
	console.log(`[route.ts] Executing POST handler...`);
	const res = await h.POST(request);
	console.log(`[route.ts] POST response generated with status ${res?.status}`);
	return res;
}

export async function PATCH(request: Request) {
	const h = await getHandlers();
	return h.PATCH(request);
}

export async function PUT(request: Request) {
	const h = await getHandlers();
	return h.PUT(request);
}

export async function DELETE(request: Request) {
	const h = await getHandlers();
	return h.DELETE(request);
}