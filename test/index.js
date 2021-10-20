import {build, stop} from 'https://deno.land/x/esbuild@v0.13.8/mod.js'
import denoCache from '../mod.ts'

let {outputFiles} = await build({
  bundle: true,
  entryPoints: ['test/hello.jsx'],
  jsxFactory: 'h',
  plugins: [denoCache],
  write: false
})

eval(outputFiles[0].text)
// expected: <h1>Hello, world!</h1>
// actual: <h1>Hello, world!</h1>

stop()
