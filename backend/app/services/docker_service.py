import docker
import os

client = docker.from_env()

CHALLENGE_TIMEOUT = 30 * 60  # 30 minutes


def start_challenge_container(docker_image: str, challenge_id: str, user_id: str) -> dict:
    container = client.containers.run(
        docker_image,
        detach=True,
        remove=True,
        mem_limit="128m",
        cpu_period=100000,
        cpu_quota=50000,
        network_mode="bridge",
        labels={"cyberquest": "1", "challenge_id": challenge_id, "user_id": user_id},
    )
    return {"container_id": container.id, "status": "running"}


def stop_container(container_id: str):
    try:
        container = client.containers.get(container_id)
        container.stop(timeout=5)
    except docker.errors.NotFound:
        pass
