export function parse(value: string) {
  let index = 0
  function sub() {
    const keywords = []
    let current = index
    function saveKeyword() {
      if (index - 1 > current) {
        keywords.push(value.slice(current, index - 1))
      }
    }
    while (index < value.length) {
      const c = value[index++]
      // console.log("c", c, index)
      if (c === '(') {
        keywords.push(sub())
        current = index
      } else if (c === ')') {
        saveKeyword()
        return keywords
      } else if (c === ' ') {
        saveKeyword()
        current = index
      }
    }
    saveKeyword()
    return keywords
  }
  return sub()[0]
}

export function unwrapXYList(tree: Array) {
  // console.log("unwrapXYList", tree)
  return {
    x: parseInt(tree[0].substring(1)),
    y: parseInt(tree[1].substring(1)),
  }
}

export function unwrapSome(tree: Array) {
  // console.log("unwrapSome", tree)
  if (tree[0] === 'some') {
    return tree[1]
  } else {
    throw NotSomeErr
  }
}

export function unwrapOK(tree) {
  // console.log("unwrapOK", tree)
  if (tree[0] === 'ok') {
    return tree[1]
  } else {
    throw NotOKErr
  }
}
