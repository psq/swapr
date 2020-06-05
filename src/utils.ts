import {
  ClarityParseError,
  NoLiquidityError,
  NotOwnerError,
  NotOKErr,
  NotSomeErr,
} from './errors'

export function parse(value: string) {
  let index = 0
  function sub() {
    const keywords = []
    let current = index
    function saveKeyword() {
      if (index - 1 > current) {
        // @ts-ignore
        keywords.push(value.slice(current, index - 1))
      }
    }
    while (index < value.length) {
      const c = value[index++]
      // console.log("c", c, index)
      if (c === '(') {
        // @ts-ignore
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

export function unwrapList(tree: any) {
  // console.log("unwrapList", tree)
  return tree
}

export function unwrapXYList(tree: any) {
  // console.log("unwrapXYList", tree)
  return {
    x: parseInt(tree[0].substring(1)),
    y: parseInt(tree[1].substring(1)),
  }
}

export function unwrapSome(tree: any): any {
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

export function replaceString(body: string, original: string, replacement: string) {
  const regexp = new RegExp(original, 'g')  // limited to principal and contract names with . and - should work
  return body.replace(regexp, replacement)
}