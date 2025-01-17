"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const experimental_utils_1 = require("@typescript-eslint/experimental-utils");
const tsutils = __importStar(require("tsutils"));
const ts = __importStar(require("typescript"));
const createRule_1 = require("../util/createRule");
const types_1 = require("../util/types");
//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------
exports.default = (0, createRule_1.createRule)({
    name: "strict-logical-expressions",
    defaultOptions: [{ allowString: false, allowNumber: false }],
    meta: {
        docs: {
            description: "Forbid non-boolean falsey values in inline expressions",
            recommended: "error",
        },
        fixable: "code",
        type: "problem",
        schema: [
            {
                type: "object",
                properties: {
                    allowString: { type: "boolean" },
                    allowNumber: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            conditionErrorFalseyString: "Potentially falsey string in logical AND expression. Please use boolean.",
            conditionErrorFalseyNumber: "Potentially falsey number in logical AND expression. Please use boolean.",
            conditionToBeFixed: "Potentially falsey boolean value in logical AND expression. Please use boolean cast (!!).",
        },
    },
    create(context, [options]) {
        const parserServices = experimental_utils_1.ESLintUtils.getParserServices(context);
        const typeChecker = parserServices.program.getTypeChecker();
        function checkIdentifier(node) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
            const types = tsutils.unionTypeParts((0, types_1.getConstrainedTypeAtLocation)(typeChecker, tsNode));
            const hasPotentiallyFalseyString = types.some((type) => tsutils.isTypeFlagSet(type, ts.TypeFlags.StringLike) &&
                (!type.isStringLiteral() || type.value === ""));
            if (!options.allowString && hasPotentiallyFalseyString) {
                return "conditionErrorFalseyString";
            }
            const hasPotentiallyFalseyNumber = types.some((type) => tsutils.isTypeFlagSet(type, ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike) &&
                (!type.isNumberLiteral() || type.value === 0));
            if (!options.allowNumber && hasPotentiallyFalseyNumber) {
                return "conditionErrorFalseyNumber";
            }
            return "conditionToBeFixed";
        }
        function checkAndReportIdentifier(node, fixNode) {
            const errorId = checkIdentifier(node);
            if (errorId) {
                context.report({
                    node,
                    messageId: errorId,
                    fix: (fixer) => fixer.insertTextBefore(fixNode, "!!"),
                });
            }
        }
        function checkLogicalExpression(expressionNode, checkRightNode) {
            let leftNode = expressionNode.left;
            if (leftNode.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.MemberExpression &&
                leftNode.property.type !== experimental_utils_1.TSESTree.AST_NODE_TYPES.PrivateIdentifier) {
                leftNode = leftNode.property;
            }
            if (leftNode.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.LogicalExpression) {
                checkLogicalExpression(leftNode, true);
            }
            else if (leftNode.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.Identifier) {
                checkAndReportIdentifier(leftNode, expressionNode.left);
            }
            if (checkRightNode) {
                let rightNode = expressionNode.right;
                if (rightNode.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.MemberExpression &&
                    rightNode.property.type !== experimental_utils_1.TSESTree.AST_NODE_TYPES.PrivateIdentifier) {
                    rightNode = rightNode.property;
                }
                if (rightNode.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.Identifier) {
                    checkAndReportIdentifier(rightNode, expressionNode.right);
                }
            }
        }
        function checkJSXExpression(node) {
            if (node.expression.type === experimental_utils_1.TSESTree.AST_NODE_TYPES.LogicalExpression &&
                node.expression.operator === "&&") {
                checkLogicalExpression(node.expression, false);
            }
        }
        return {
            JSXExpressionContainer: checkJSXExpression,
        };
    },
});
//# sourceMappingURL=strict-logical-expressions.js.map