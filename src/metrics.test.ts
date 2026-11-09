import { describe, expect, it } from 'vitest';
import { demoState, DEMO_LOST_AT } from './demo';
import { poseMetricResults, unavailableShotMetrics } from './metrics';
import { makeReport } from './analysis';

describe('demonstration isolation and missing measurements', () => {
  it('never makes a physical speed or distance from a real ball track', () => {
    const report=makeReport({name:'clip.mp4',type:'video/mp4',bytes:500,width:640,height:360,duration:3},'dtl',false,{impact:0},[],{points:[{time:0,x:.1,y:.8,source:'manual'},{time:1,x:.8,y:.1,source:'detected'}],stoppedAt:null,reason:''});
    expect(report.metrics.shot).toHaveLength(6);
    expect(report.metrics.shot.every(m=>m.value===null && m.source==='unavailable' && m.reason.length>0)).toBe(true);
    expect(JSON.stringify(report)).not.toContain('145');
  });
  it('labels every demo number as simulation and never places it in real results', () => {
    const demo=demoState(6,'straight');
    expect(demo.metrics.every(m=>m.source==='simulation')).toBe(true);
    expect(demo.metrics.find(m=>m.id==='smashFactor')!.value).toBe(1.35);
    expect(unavailableShotMetrics().every(m=>m.value===null)).toBe(true);
  });
  it('stops a lost trace without adding a predicted landing or filling missing metrics', () => {
    const stopped=demoState(DEMO_LOST_AT,'lost'), ended=demoState(6,'lost');
    expect(ended.points).toEqual(stopped.points); expect(ended.ball).toEqual(stopped.ball);
    expect(ended.metrics.every(m=>m.value===null)).toBe(true);
    expect(ended.fraction).toBeLessThan(1);
  });
  it('mirrors only the simulated fade direction for a left-handed player', () => {
    const right=demoState(6,'fade'), left=demoState(6,'fade',true);
    expect(left.ball.x).toBe(600-right.ball.x); expect(left.ball.y).toBe(right.ball.y);
    expect(left.metrics).toEqual(right.metrics);
  });
  it('retains image-only units and provenance for pose metrics', () => {
    const metrics=poseMetricResults({xPct:4,yPct:-2,spineDeg:26});
    expect(metrics.every(m=>m.source==='image-2d')).toBe(true);
    expect(metrics[0].unit).toContain('ความสูงตัว'); expect(metrics[2].unit).toBe('°');
  });
});
