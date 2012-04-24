(function () {
  function forEach(arr, f) {
    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
  }
  
  function arrayContains(arr, item) {
    if (!Array.prototype.indexOf) {
      var i = arr.length;
      while (i--) {
        if (arr[i] === item) {
          return true;
        }
      }
      return false;
    }
    return arr.indexOf(item) != -1;
  }

  function scriptHint(editor, keywords, getToken) {
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
    // If it's not a 'word-style' token, ignore the token.
	if (!/^[\w$_]*$/.test(token.string)) {
      token = tprop = {start: cur.ch, end: cur.ch, string: "", state: token.state,
                       className: token.string == "." ? "property" : null};
    }

    if (!context) var context = [];
	context.push(tprop);
	
    return {list: getCompletions(token, context, keywords),
            from: {line: cur.line, ch: token.start},
            to: {line: cur.line, ch: token.end}};
  }
  
  CodeMirror.pigHint = function(editor) {
    return scriptHint(editor, pigKeywords, function (e, cur) {return e.getTokenAt(cur);});
  }
  
  var pigKeywords = ("VOID IMPORT RETURNS DEFINE LOAD FILTER FOREACH ORDER CUBE DISTINCT COGROUP "
	+ "JOIN CROSS UNION SPLIT INTO IF OTHERWISE ALL AS BY USING INNER OUTER ONSCHEMA PARALLEL "
	+ "PARTITION GROUP AND OR NOT GENERATE FLATTEN ASC DESC IS STREAM THROUGH STORE MAPREDUCE "
	+ "SHIP CACHE INPUT OUTPUT STDERROR STDIN STDOUT LIMIT SAMPLE LEFT RIGHT FULL EQ GT LT GTE LTE " 
	+ "NEQ MATCHES TRUE FALSE").split(" ");
  var pigTypes = ("BOOLEAN INT LONG FLOAT DOUBLE CHARARRAY BYTEARRAY BAG TUPLE MAP").split(" ");
  var pigBuiltins = ("ABS ACOS ARITY ASIN ATAN AVG BagSize BinStorage Bloom BuildBloom CBRT CEIL " 
	+ "CONCAT COR COS COSH COUNT COUNT_STAR COV ConstantSize CubeDimensions DIFF DISTINCT DoubleAbs "
	+ "DoubleAvg DoubleBase DoubleMax DoubleMin DoubleRound DoubleSum EXP FLOOR FloatAbs FloatAvg "
	+ "FloatMax FloatMin FloatRound FloatSum GenericInvoker INDEXOF IntAbs IntAvg IntMax IntMin "
	+ "IntSum InvokeForDouble InvokeForFloat InvokeForInt InvokeForLong InvokeForString Invoker "
	+ "IsEmpty JsonLoader JsonMetadata JsonStorage LAST_INDEX_OF LCFIRST LOG LOG10 LOWER LongAbs "
	+ "LongAvg LongMax LongMin LongSum MAX MIN MapSize MonitoredUDF Nondeterministic OutputSchema  "
	+ "PigStorage PigStreaming RANDOM REGEX_EXTRACT REGEX_EXTRACT_ALL REPLACE ROUND SIN SINH SIZE "
	+ "SQRT STRSPLIT SUBSTRING SUM StringConcat StringMax StringMin StringSize TAN TANH TOBAG "
	+ "TOKENIZE TOMAP TOP TOTUPLE TRIM TextLoader TupleSize UCFIRST UPPER Utf8StorageConverter").split(" "); 	
                  
  function getCompletions(token, context, keywords) {
    var found = [], start = token.string;
    function maybeAdd(str) {
      if (str.indexOf(start) == 0 && !arrayContains(found, str)) found.push(str);
    }
    function gatherCompletions(obj) {
 	  forEach(pigBuiltins, maybeAdd);
 	  forEach(pigTypes, maybeAdd);
 	  forEach(pigKeywords, maybeAdd);
      for (var name in obj) maybeAdd(name);
    }

    if (context) {
      // If this is a property, see if it belongs to some object we can
      // find in the current environment.
      var obj = context.pop(), base;

	  if (obj.className == "pig-word") 
          base = obj.string;
          
      while (base != null && context.length)
        base = base[context.pop().string];
      if (base != null) gatherCompletions(base);
    }
    else {
      // If not, just look in the window object and any local scope
      // (reading into JS mode internals to get at the local variables)
      for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
      gatherCompletions(window);
      forEach(keywords, maybeAdd);
    }
    return found;
  }
})();
