"use strict";var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");var _Object$defineProperty2 = require("@babel/runtime-corejs2/core-js/object/define-property");_Object$defineProperty2(exports, "__esModule", { value: true });exports.default = getFileDownloadHandler;var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-property"));var _defineProperties = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-properties"));var _getOwnPropertyDescriptors = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptors"));var _getOwnPropertyDescriptor = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptor"));var _getOwnPropertySymbols = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-symbols"));var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));var _contentDisposition = _interopRequireDefault(require("content-disposition"));
var _pathParser = _interopRequireDefault(require("path-parser"));
var _debug = _interopRequireDefault(require("../debug"));
var _requestRange = _interopRequireDefault(require("./requestRange"));
var _writeHeadersToResponse = _interopRequireDefault(require("./writeHeadersToResponse"));function ownKeys(object, enumerableOnly) {var keys = (0, _keys.default)(object);if (_getOwnPropertySymbols.default) {var symbols = (0, _getOwnPropertySymbols.default)(object);if (enumerableOnly) symbols = symbols.filter(function (sym) {return (0, _getOwnPropertyDescriptor.default)(object, sym).enumerable;});keys.push.apply(keys, symbols);}return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i] != null ? arguments[i] : {};if (i % 2) {ownKeys(Object(source), true).forEach(function (key) {(0, _defineProperty3.default)(target, key, source[key]);});} else if (_getOwnPropertyDescriptors.default) {(0, _defineProperties.default)(target, (0, _getOwnPropertyDescriptors.default)(source));} else {ownKeys(Object(source)).forEach(function (key) {(0, _defineProperty2.default)(target, key, (0, _getOwnPropertyDescriptor.default)(source, key));});}}return target;}

// NOTE: This path can be changed back to "/:collectionName/:fileId/:storeName/:filename" if this issue is fixed and pulled in:
// https://github.com/troch/path-parser/issues/22
const matchFix = "<[a-zA-Z0-9-_.~%':|\\+]+>";
const routePath = new _pathParser.default(`/:collectionName${matchFix}/:fileId${matchFix}/:storeName${matchFix}/:filename${matchFix}`);

/**
                                                                                                                                         * @param {Object} param0 options for file downloader
                                                                                                                                         * @returns {void} null
                                                                                                                                         */
function getFileDownloadHandler({
  getFileInfo,
  getReadStream,
  headers: customResponseHeaders,
  shouldAllowGet } =
{}) {
  return async (req, res) => {
    const { headers, method, originalUrl, query, url } = req;

    (0, _debug.default)("---------------------------------------");
    (0, _debug.default)("FSHTTP request received:");
    (0, _debug.default)("  url:", url);
    (0, _debug.default)("  originalUrl:", originalUrl);
    (0, _debug.default)("  method:", method);
    (0, _debug.default)("  headers:", headers);
    (0, _debug.default)("  query:", (0, _stringify.default)(query));
    (0, _debug.default)("---------------------------------------");

    const itemsFromUrl = routePath.partialTest(url);
    if (!itemsFromUrl) {
      (0, _debug.default)(`Unable to parse file download URL: ${url}`);
      res.writeHead(400, "Bad Request");
      res.end();
      return;
    }

    const {
      collectionName,
      fileId,
      filename,
      storeName } =
    routePath.partialTest(url);

    (0, _debug.default)("Parsed from URL:", { collectionName, fileId, filename, storeName });

    if (!collectionName || !fileId || !filename || !storeName) {
      (0, _debug.default)("Request was missing some information");
      res.writeHead(400, "Bad Request");
      res.end();
      return;
    }

    // context is an object that getFileInfo can mutate with any info the
    // other functions will need later.
    const context = {};

    const fileInfo = await getFileInfo({
      collectionName,
      context,
      fileId,
      filename,
      query,
      storeName });


    (0, _debug.default)("getFileInfo returned", fileInfo);

    if (!fileInfo) {
      res.writeHead(404, "File Not Found");
      res.end();
      return;
    }

    const { name, size, type, updatedAt } = fileInfo;
    switch (method.toLowerCase()) {
      case "get":{
          if (!(await shouldAllowGet(context, req))) {
            (0, _debug.default)("shouldAllowGet returned false");
            res.writeHead(403, "Forbidden");
            res.end();
            return;
          }

          const { download } = query;

          // Get the contents range from request
          const range = (0, _requestRange.default)(headers, size);
          if (range.errorCode) {
            res.writeHead(range.errorCode);
            res.end(range.errorMessage);
            return;
          }

          (0, _debug.default)("Requested range details:", range);

          // Write HTTP headers
          const responseHeaders = _objectSpread({
            // Inform clients that we accept ranges for resumable chunked downloads
            "Accept-Ranges": range.unit,
            // Tell browser whether it should display or download the file
            "Content-Disposition": download ? (0, _contentDisposition.default)(filename || name) : "inline",
            "Content-Length": range.len,
            // Some browsers cope better if the content-range header is
            // still included even for the full file being returned.
            "Content-Range": `${range.unit} ${range.start}-${range.end}/${range.size}`,
            "Content-Type": type || "application/octet-stream",
            "Last-Modified": updatedAt ? updatedAt.toUTCString() : null },
          customResponseHeaders && customResponseHeaders.get || {});

          (0, _writeHeadersToResponse.default)(res, responseHeaders);

          let readStream;
          try {
            readStream = await getReadStream(context, range);
          } catch (error) {
            console.error(error); // eslint-disable-line no-console
            res.writeHead(503, "Service Unavailable");
            res.end();
            return;
          }

          readStream.once("error", error => {
            console.error(error); // eslint-disable-line no-console
            res.writeHead(503, "Service Unavailable");
            res.end();
          });

          readStream.pipe(res);

          // If a chunk/range was requested instead of the whole file, use 206 success code
          res.writeHead(range.partial ? 206 : 200);
          break;
        }
      default:
        res.writeHead(405, "Method Not Allowed");
        res.end();
        break;}

  };
}