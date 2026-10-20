// The capability belongs to the independent game source, not a local-path override.
// Old registry-locked static releases retain their original commands.
export function gameValidation(game,packageInfo) {
  const standalone=game.build.type==='static' && packageInfo?.kplgame?.standaloneBuild===true;
  const npmBuild=game.build.type==='npm'||standalone;
  const build=npmBuild?['npm','run','build',...(game.build.args?.length?['--',...game.build.args]:[])]:null;
  const typecheckInBuild=Boolean(build && /^npm run typecheck\s*&&/.test(packageInfo?.scripts?.build??''));
  return {install:npmBuild,test:standalone?['npm','test']:game.build.test,build,
    typecheck:packageInfo?.scripts?.typecheck&&!typecheckInBuild?['npm','run','typecheck']:null,typecheckInBuild};
}
