export function synopsisBuilder(templateArray, data, defaultFallback, stringFallbacks = {}) {
  if (!Array.isArray(templateArray)) return [];
console.log('synopsisBuilder',templateArray, data, defaultFallback);
  return templateArray.map(templateStr => {
    if (!templateStr) return "";

    // 1. Process inline conditionals first: !{variable==value?trueText:falseText}
    let parsedStr = templateStr.replace(/!\{([^}]+)\}/g, (match, innerContent) => {
      const [condition, choices] = innerContent.split('?');
      if (!choices) return match;

      // FIX: Splitting by ':' but NOT trimming yet, to preserve custom spaces
      const parts = choices.split(':');
      const ifTrue = parts[0];
      const ifFalse = parts[1] || '';

      let operator = "==";
      if (condition.includes('!=')) operator = '!=';
      else if (condition.includes('>=')) operator = '>=';
      else if (condition.includes('<=')) operator = '<=';
      else if (condition.includes('>')) operator = '>';
      else if (condition.includes('<')) operator = '<';

      const [varKey, targetRaw] = condition.split(operator).map(s => s.trim());
      const cleanKey = varKey.startsWith('fields.') ? varKey.replace('fields.', '') : varKey;
      const leftVal = data[cleanKey];

      let evaluation = false;

      // Handle the custom isNull operator check
      if (targetRaw && targetRaw.trim() === 'isNull') {
        const isNullish = (leftVal === undefined || leftVal === null || String(leftVal).trim() === '');
        evaluation = (operator === '==') ? isNullish : !isNullish;
      } else {
        // Fallback to normal standard logic
        const rightVal = targetRaw ? targetRaw.replace(/['"]/g, '') : '';
        const isNumeric = !isNaN(leftVal) && !isNaN(rightVal) && leftVal !== '' && rightVal !== '';
        const v1 = isNumeric ? Number(leftVal) : String(leftVal ?? '');
        const v2 = isNumeric ? Number(rightVal) : String(rightVal);

        if (operator === '==') evaluation = (v1 == v2);
        if (operator === '!=') evaluation = (v1 != v2);
        if (operator === '>')  evaluation = (v1 > v2);
        if (operator === '<')  evaluation = (v1 < v2);
        if (operator === '>=') evaluation = (v1 >= v2);
        if (operator === '<=') evaluation = (v1 <= v2);
      }

      // FIX: Removed .trim() from outputs to preserve your intentional space strings!
      return evaluation ? (ifTrue || '') : ifFalse;
    });

    // 2. Process pipe placeholders second: ${expression | fallback : transformer}
    return parsedStr.replace(/\${([^}]+)}/g, (match, innerContent) => {
      let transformer = null;
      let workingContent = innerContent;
      if (workingContent.includes(':')) {
        const parts = workingContent.split(':');
        workingContent = parts[0];
        transformer = parts[1].trim().toLowerCase();
      }

      let fallbackText = defaultFallback;
      if (workingContent.includes('|')) {
        const parts = workingContent.split('|');
        workingContent = parts[0];
        fallbackText = parts[1].trim().replace(/^['"]|['"]$/g, '');
      }

      let expression = workingContent.trim();

      let operator = null;
      let operand = 0;
      const mathMatch = expression.match(/([+\-*/])\s*(\d+(\.\d+)?)/);

      if (mathMatch) {
        operator = mathMatch[1];
        operand = Number(mathMatch[2]);
        expression = expression.replace(/[+\-*/]\s*\d+(\.\d+)?/, '').trim();
      }

      const varKey = expression.startsWith('fields.') ? expression.replace('fields.', '') : expression;
      let resolvedValue = data[varKey];

      if (resolvedValue === undefined || resolvedValue === null || String(resolvedValue).trim() === '') { // todo need testing for errors
        return stringFallbacks[varKey] ?? fallbackText;
      }

      if (operator) {
        let num = Number(String(resolvedValue).replace(/,/g, ''));
        if (!isNaN(num)) {
          if (operator === '+') resolvedValue = num + operand;
          if (operator === '-') resolvedValue = num - operand;
          if (operator === '*') resolvedValue = num * operand;
          if (operator === '/') resolvedValue = num / operand;
        }
      }

      if (transformer) {
        if (transformer === 'lowercase') resolvedValue = String(resolvedValue).toLowerCase();
        if (transformer === 'uppercase') resolvedValue = String(resolvedValue).toUpperCase();
        if (transformer === 'trim') resolvedValue = String(resolvedValue).trim();

        let numValue = Number(String(resolvedValue).replace(/,/g, ''));
        if (!isNaN(numValue)) {
          if (transformer === 'round') resolvedValue = Math.round(numValue);
          if (transformer === 'floor') resolvedValue = Math.floor(numValue);
          if (transformer === 'ceil') resolvedValue = Math.ceil(numValue);
        }
      }

      return resolvedValue;
    });
  });
}
