# TODO - Re-enable ClamAV scanning using clamscan (no new port)

- [ ] Update Dockerfile (runner stage) to install ClamAV binaries (clamscan).
- [ ] Implement `lib/clamav.ts` using `clamscan` CLI against downloaded bytes (temp file approach).
- [ ] Re-enable scanning in `app/api/files/scan/route.ts` to call `scanObjectFromMinio` and return infected/clean.
- [ ] Verify build (`docker compose build --no-cache`) and runtime (`docker compose up`).
- [ ] Manually test `/api/files/scan` endpoint response shape.

