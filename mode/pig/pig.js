CodeMirror.defineMode("pig", function(config, parserConfig) {
	var indentUnit = config.indentUnit,
		keywords = parserConfig.keywords,
		builtins = parserConfig.builtins;
	
	var isOperatorChar = /[*+\-%<>=&?:\/!|]/;
	
	function chain(stream, state, f) {
		state.tokenize = f;
		return f(stream, state);
	}
	
	var type;
	function ret(tp, style) {
		type = tp;
		return style;
	}
	
	function tokenComment(stream, state) {
		var isEnd = false;
		var ch;
		while(ch = stream.next()) {
			if(ch == "/" && isEnd) {
				state.tokenize = tokenBase;
				break;
			}
			isEnd = (ch == "*");
		}
		return ret("comment", "pig-comment");
	}
	
	function tokenBase(stream, state) {
		var ch = stream.next();
		
		// is it one of the special chars
		if(/[\[\]{}\(\),;\.]/.test(ch))
			return ret(ch);
		// is it a number?
		else if(/\d/.test(ch)) {
			stream.eatWhile(/[\w\.]/);
			return ret("number", "number");
		}
		// multi line comment or operator
		else if (ch == "/") {
			if (stream.eat("*")) {
				return chain(stream, state, tokenComment);
			}
			else {
				stream.eatWhile(isOperatorChar);
				return ret("operator", "operator");
			}
		}
		// single line comment or operator
		else if (ch=="-") {
			if(stream.eat("-")){
				stream.skipToEnd();
				return ret("comment", "comment");
			}
			else {
				stream.eatWhile(isOperatorChar);
				return ret("operator", "operator");
			}
		}
		// is it an operator
		else if (isOperatorChar.test(ch)) {
			stream.eatWhile(isOperatorChar);
			return ret("operator", "operator");
		}
		else {
		}
	}
	
	// Interface
	
	return {
		startState: function(basecolumn) {
			return {
				tokenize: tokenBase,
				startOfLine: true
			};
		},
		
		token: function(stream, state) {
			if(stream.eatSpace()) return null;
			var style = state.tokenize(stream, state);
			return style;
		}
	};
});

(function() {
	function keywords(str) {
		var obj = {}, words = str.split(" ");
		for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
 		return obj;
 	}

	// builtin funcs taken from http://pig.apache.org/docs/r0.9.1/func.html
	var pBuiltins = "AVG CONCAT COUNT COUNT_START DIFF IsEmpty MAX MIN SIZE SUM TOKENIZE BinStorage" 
	+ "PigDump PigStorage TextLoader ABS ACOS ASIN ATAN CBRT CEIL COS COSH EXP FLOOR LOG LOG10" 
	+ "RANDOM ROUND SIN SINH SQRT TAN TANH INDEXOF LAST_INDEX_OF LCFIRST LOWER REGEX_EXTRACT" 
	+ "REGEX_EXTRACT_ALL REPLACE STRSPLIT SUBSTRING TRIM UCFIRST UPPER TOBAG TOP TOTUPLE";
	
	// taken from QueryLexer.g
	var pKeywords = "VOID IMPORT RETURNS DEFINE LOAD FILTER FOREACH ORDER CUBE DISTINCT COGROUP"
	+ "JOIN CROSS UNION SPLIT INTO IF OTHERWISE ALL AS BY USING INNER OUTER ONSCHEMA PARALLEL"
	+ "PARTITION GROUP AND OR NOT GENERATE FLATTEN ASC DESC BOOLEAN INT LONG FLOAT DOUBLE"
	+ "CHARARRAY BYTEARRAY BAG TUPLE MAP IS STREAM THROUGH STORE MAPREDUCE SHIP CACHE INPUT"
	+ "OUTPUT STDERROR STDIN STDOUT LIMIT SAMPLE LEFT RIGHT FULL EQ GT LT GTE LTE NEQ MATCHES" 
	+ "TRUE FALSE"; 	
	
	CodeMirror.defineMIME("text/x-pig", {
	 name: "pig",
	 builtins: keywords(pBuiltins),
	 keywords: keywords(pKeywords)
	 });
}());