import './chunk-GN5PWX3D.mjs';
import { global } from '@storybook/global';

var excludeTags=Object.entries(global.TAGS_OPTIONS??{}).reduce((acc,entry)=>{let[tag,option]=entry;return option.excludeFromDocsStories&&(acc[tag]=!0),acc},{}),parameters={docs:{renderer:async()=>{let{DocsRenderer}=await import('./DocsRenderer-K4EAMTCU.mjs');return new DocsRenderer},stories:{filter:story=>(story.tags||[]).filter(tag=>excludeTags[tag]).length===0&&!story.parameters.docs?.disable}}};

export { parameters };
