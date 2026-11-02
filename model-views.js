'use strict';
/* One source of camera projection for drawing and picking. */
function createModelViews({ THREE, state, getTarget }) {
    let panelOffset = 0;
    const stereo = () => state.stereoMode !== 'off';
    function resetLayout() {
        const panel = document.getElementById('ui-panel');
        const rect = panel.getBoundingClientRect();
        const sidePanel = !panel.classList.contains('hidden') && rect.left > innerWidth * .35 && rect.right >= innerWidth - 45;
        panelOffset = sidePanel ? (innerWidth - rect.left) / 2 : 0;
    }
    function camera(source, width, height, side = null) {
        source.updateMatrixWorld(true);
        const view = source.clone();
        view.clearViewOffset();
        view.zoom *= Math.min(1, width / height);
        if (view.isPerspectiveCamera) view.aspect = width / height;
        else {
            const h = source.top - source.bottom;
            view.left = -h * width / height / 2;
            view.right = -view.left;
        }
        const layout = !stereo() && width === innerWidth ? panelOffset : 0;
        view.setViewOffset(width, height, state.viewOffsetX + layout, state.viewOffsetY, width, height);
        if (stereo() && side !== null) {
            const distance = Math.max(.1, source.position.distanceTo(getTarget()));
            const separation = distance * .035;
            const eye = (side === 0 ? -1 : 1) * (state.stereoMode === 'cross' ? -1 : 1) * separation / 2;
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(source.quaternion);
            view.position.addScaledVector(right, eye);
            view.projectionMatrix.elements[8] -= eye * view.projectionMatrix.elements[0] / distance;
            view.projectionMatrixInverse.copy(view.projectionMatrix).invert();
            view.userData.eyeOffset = eye;
        }
        view.updateMatrixWorld(true);
        return view;
    }
    function pick(source, x, y, compare = false) {
        const split = stereo() || compare;
        const width = split ? innerWidth / 2 : innerWidth;
        const side = split && x >= width ? 1 : 0;
        return { camera: camera(source, width, innerHeight, stereo() ? side : null),
            ndc: new THREE.Vector2((x - side * width) / width * 2 - 1, 1 - y / innerHeight * 2), side };
    }
    function render(renderer, scene, source) {
        const width = stereo() ? innerWidth / 2 : innerWidth;
        renderer.setScissorTest(stereo());
        for (let side = 0; side < (stereo() ? 2 : 1); side++) {
            renderer.setViewport(side * width, 0, width, innerHeight);
            if (stereo()) renderer.setScissor(side * width, 0, width, innerHeight);
            renderer.render(scene, camera(source, width, innerHeight, stereo() ? side : null));
        }
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, innerWidth, innerHeight);
    }
    return {camera, pick, render, resetLayout, stereo};
}
