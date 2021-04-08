export function parse(value) {
  let index = 0

  function sub() {
    const keywords = []
    let current = index

    function saveKeyword() {
      if (index - 1 > current) {
      	const keyword = value.slice(current, index - 1)
      	// console.log("keyword", keyword)
        keywords.push(keyword)
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
    // console.log("keywords so far", keywords)
    return keywords
  }
  return sub()[0]
}

export function unwrapTuple(tree) {
	// console.log("unwrapTuple", tree)
	if (tree[0] === 'tuple') {
		const result = {}
		let index = 1
		while (tree[index]) {
			result[tree[index][0]] = tree[index][1]
			index++
		}
		return result
	}
	return null
}

export function unwrapList(tree) {
  console.log("unwrapList", tree)
  return tree
}

// export function unwrapXYList(tree) {
//   // console.log("unwrapXYList", tree)
//   return {
//     x: parseInt(tree[0].substring(1)),
//     y: parseInt(tree[1].substring(1)),
//   }
// }

export function unwrapSome(tree) {
  // console.log("unwrapSome", tree)
  if (tree[0] === 'some') {
    return tree[1]
  } else {
    // throw NotSomeErr
  	return null
  }
}

export function unwrapOK(tree) {
  console.log("unwrapOK", tree)
  if (tree[0] === 'ok') {
    return tree[1]
  } else {
    // throw NotOKErr
  	return null
  }
}

export function unwrapUInt(tree) {
	if (tree.startsWith('u')) {
		return parseInt(tree.slice(1))
	}
	return null
}

