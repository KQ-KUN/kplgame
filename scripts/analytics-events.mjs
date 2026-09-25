import fs from 'node:fs/promises';
import path from 'node:path';

export const eventNames=Object.freeze([
  'pageview-portal','pageview-kpl2k','pageview-guessing','pageview-link',
  'portal-click-kpl2k','portal-click-guessing','portal-click-link',
  'kpl2k-start','kpl2k-complete','guessing-start','guessing-complete','guessing-restart',
  'link-start','link-complete','link-reveal','link-restart',
  'source-bilibili','source-xiaohongshu','source-zhihu','source-wechat','source-other'
]);

export async function writeEventFiles(output) {
  const directory=path.join(output,'__event');
  await fs.mkdir(directory,{recursive:true});
  for(const event of eventNames) await fs.writeFile(path.join(directory,`${event}.txt`),'ok\n');
}
