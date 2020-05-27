export function wait(ms: number) {
  return new Promise((accept) => setTimeout(accept, ms))
}

export async function waitForTX(base_url: string, tx_id: string, max_wait: number) {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
  // console.log("request.body", options)

  const unwrapped_tx_id = tx_id.substring(1, tx_id.length - 1)
  console.log("waitForTX", unwrapped_tx_id)
  try {
    const wait_time = 500
    let wait_count = Math.round(max_wait / wait_time)
    while (wait_count > 0) {
      const response = await fetch(`${base_url}/sidecar/v1/tx/${unwrapped_tx_id}`, options)
      // console.log(response)

      if (response.ok) {
        const json = await response.json()
        if (json.tx_status === 'success') {
          return json
        } else {
          throw new Error(`transaction ${unwrapped_tx_id} failed: ${json.tx_status}`)
        }
      } else if (response.status === 404) {
        console.log("waiting", wait_count)
        await wait(500)
        wait_count--
      } else {
        throw new Error(`Request failed with ${response.status} ${response.statusText}`)
      }
    }
    throw new Error(`did not return a value after ${max_Wait}`)
  } catch (e) {
    throw e
  }
}