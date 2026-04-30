// ✅ FINAL WORKING PATCH: Node.js ESM Windows path bug (April 2026)
import { pathToFileURL, fileURLToPath } from 'url';
import Module from 'module';

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (typeof request === 'string' && request.startsWith('file://')) {
    return fileURLToPath(request);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (typeof request === 'string' && request.startsWith('file://')) {
    request = fileURLToPath(request);
  }
  return originalLoad.call(this, request, parent, isMain);
};

export {};